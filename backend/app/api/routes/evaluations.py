"""Evaluation execution routes."""

import asyncio
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.evaluation_run import EvaluationRunRecord, RunResultRecord, RunState
from app.models.test_case import TestCase, ApprovalStatus
from app.schemas.schemas import (
    RunEvaluationRequest,
    EvaluationRunResponse,
    RunResultResponse,
    AIAnalysisRequest,
    AIAnalysisResponse,
)
from app.services.ces_client import get_ces_client
from app.services.gemini_service import get_gemini_service

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


async def poll_operation(ces, operation_id: str, timeout: int = 600):
    """Poll operation until completion."""
    import time

    start_time = time.time()

    while time.time() - start_time < timeout:
        operation = await ces.get_operation(operation_id)

        if operation.get("done"):
            if operation.get("error"):
                raise Exception(f"Operation failed: {operation.get('error')}")
            return operation.get("result", {})

        await asyncio.sleep(5)

    raise TimeoutError("Operation timed out")


@router.post(
    "/run", response_model=EvaluationRunResponse, status_code=status.HTTP_201_CREATED
)
async def run_evaluation(
    request: RunEvaluationRequest,
    test_suite_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Run evaluation(s) against a CES app."""
    ces = get_ces_client()

    result = await db.execute(
        select(TestCase).where(
            TestCase.test_suite_id == test_suite_id,
            TestCase.status == ApprovalStatus.SUBMITTED,
            TestCase.ces_evaluation_id.isnot(None),
        )
    )
    test_cases = result.scalars().all()

    if not test_cases:
        raise HTTPException(
            status_code=400, detail="No submitted test cases found in this test suite"
        )

    evaluation_ids = [tc.ces_evaluation_id for tc in test_cases]

    if request.evaluation_ids:
        evaluation_ids = request.evaluation_ids

    run_config = {
        "evaluationIds": evaluation_ids,
        "runCount": request.run_count,
    }

    if request.app_version:
        run_config["appVersion"] = request.app_version

    if request.generate_latency_report:
        run_config["generateLatencyReport"] = True

    if request.use_dataset:
        pass

    eval_run = EvaluationRunRecord(
        test_suite_id=test_suite_id,
        ces_run_id=None,
        state=RunState.PENDING,
        evaluation_type="golden" if request.run_count == 1 else "scenario",
        total_count=len(evaluation_ids),
        passed_count=0,
        failed_count=0,
        error_count=0,
    )
    db.add(eval_run)
    await db.commit()
    await db.refresh(eval_run)

    try:
        app_id = "placeholder"
        operation = await ces.run_evaluation(app_id, run_config)
        operation_id = operation.get("name", "").split("/")[-1]

        eval_run.ces_run_id = operation_id
        eval_run.state = RunState.RUNNING
        await db.commit()

        background_tasks.add_task(
            poll_and_store_results,
            eval_run.id,
            operation_id,
            app_id,
            db,
        )

    except Exception as e:
        eval_run.state = RunState.ERROR
        await db.commit()
        raise HTTPException(
            status_code=500, detail=f"Failed to start evaluation: {str(e)}"
        )

    return eval_run


async def poll_and_store_results(
    run_id: UUID,
    operation_id: str,
    app_id: str,
    db: AsyncSession,
):
    """Poll for operation completion and store results."""
    ces = get_ces_client()

    try:
        result = await poll_operation(ces, operation_id)

        run_details = await ces.get_evaluation_run(
            app_id, result.get("evaluationRun", {}).get("name", "").split("/")[-1]
        )

        result_db = await db.execute(
            select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
        )
        eval_run = result_db.scalar_one_or_none()

        if eval_run:
            eval_run.state = RunState.COMPLETED
            eval_run.total_count = run_details.get("totalCount", 0)
            eval_run.passed_count = run_details.get("passedCount", 0)
            eval_run.failed_count = run_details.get("failedCount", 0)
            eval_run.error_count = run_details.get("errorCount", 0)

            if eval_run.total_count > 0:
                eval_run.pass_rate = (
                    eval_run.passed_count / eval_run.total_count
                ) * 100

            if "latencyReport" in run_details:
                eval_run.latency_report = run_details["latencyReport"]

            results = await ces.get_evaluation_run_results(app_id, eval_run.ces_run_id)

            for res in results.get("results", []):
                run_result = RunResultRecord(
                    evaluation_run_id=run_id,
                    ces_result_id=res.get("name"),
                    passed=res.get("passed"),
                    score=res.get("score"),
                    failure_reason=res.get("failureReason"),
                    diagnostics=res.get("diagnosticInfo"),
                    conversation_log=res.get("sessionOutput"),
                )
                db.add(run_result)

            await db.commit()

    except Exception as e:
        result_db = await db.execute(
            select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
        )
        eval_run = result_db.scalar_one_or_none()
        if eval_run:
            eval_run.state = RunState.ERROR
            await db.commit()


@router.get("/runs", response_model=List[EvaluationRunResponse])
async def list_evaluation_runs(
    test_suite_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """List evaluation runs."""
    query = select(EvaluationRunRecord)

    if test_suite_id:
        query = query.where(EvaluationRunRecord.test_suite_id == test_suite_id)

    result = await db.execute(query.order_by(EvaluationRunRecord.created_at.desc()))
    return result.scalars().all()


@router.get("/runs/{run_id}", response_model=EvaluationRunResponse)
async def get_evaluation_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Get a specific evaluation run."""
    result = await db.execute(
        select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
    )
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")

    return run


@router.get("/runs/{run_id}/results", response_model=List[RunResultResponse])
async def get_run_results(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Get results for an evaluation run."""
    result = await db.execute(
        select(RunResultRecord)
        .where(RunResultRecord.evaluation_run_id == run_id)
        .order_by(RunResultRecord.created_at)
    )
    return result.scalars().all()


@router.post("/runs/{run_id}/analyze", response_model=AIAnalysisResponse)
async def analyze_run_results(
    run_id: UUID,
    request: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Analyze evaluation run results using Gemini."""
    run_result = await db.execute(
        select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
    )
    run = run_result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")

    results_result = await db.execute(
        select(RunResultRecord).where(RunResultRecord.evaluation_run_id == run_id)
    )
    results = results_result.scalars().all()

    results_data = [
        {
            "passed": r.passed,
            "score": r.score,
            "failure_reason": r.failure_reason,
            "diagnostics": r.diagnostics,
        }
        for r in results
    ]

    gemini = get_gemini_service()
    analysis = await gemini.analyze_results(results_data, request.question)

    run.ai_analysis = analysis
    await db.commit()

    return AIAnalysisResponse(
        analysis=analysis,
        run_id=run_id,
    )


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evaluation_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Delete an evaluation run and its results."""
    result = await db.execute(
        select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
    )
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")

    await db.execute(
        select(RunResultRecord).where(RunResultRecord.evaluation_run_id == run_id)
    )

    await db.delete(run)
    await db.commit()
