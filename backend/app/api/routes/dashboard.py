"""Dashboard and analytics routes."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.test_case import TestCase, ApprovalStatus
from app.models.evaluation_run import EvaluationRunRecord, RunState
from app.schemas.schemas import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{project_id}/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    from app.models.test_suite import TestSuite

    suites_result = await db.execute(select(TestSuite.id).where(TestSuite.project_id == project_id))
    suite_ids = [s for s in suites_result.scalars().all()]

    if not suite_ids:
        return DashboardSummary(
            total_test_cases=0, approved_count=0, pending_count=0,
            total_runs=0, last_run_pass_rate=None, avg_pass_rate=None,
            total_passed=0, total_failed=0,
        )

    total_tc = await db.scalar(select(func.count(TestCase.id)).where(TestCase.test_suite_id.in_(suite_ids)))
    approved = await db.scalar(
        select(func.count(TestCase.id)).where(TestCase.test_suite_id.in_(suite_ids), TestCase.status == ApprovalStatus.SUBMITTED)
    )
    pending = await db.scalar(
        select(func.count(TestCase.id)).where(TestCase.test_suite_id.in_(suite_ids), TestCase.status == ApprovalStatus.DRAFT)
    )
    total_runs = await db.scalar(select(func.count(EvaluationRunRecord.id)).where(EvaluationRunRecord.test_suite_id.in_(suite_ids)))
    total_passed = await db.scalar(
        select(func.coalesce(func.sum(EvaluationRunRecord.passed_count), 0)).where(EvaluationRunRecord.test_suite_id.in_(suite_ids))
    )
    total_failed = await db.scalar(
        select(func.coalesce(func.sum(EvaluationRunRecord.failed_count), 0)).where(EvaluationRunRecord.test_suite_id.in_(suite_ids))
    )

    last_run_result = await db.execute(
        select(EvaluationRunRecord).where(
            EvaluationRunRecord.test_suite_id.in_(suite_ids), EvaluationRunRecord.state == RunState.COMPLETED
        ).order_by(EvaluationRunRecord.created_at.desc()).limit(1)
    )
    last_run = last_run_result.scalar_one_or_none()
    last_run_pass_rate = round(last_run.passed_count / last_run.total_count * 100, 1) if last_run and last_run.total_count > 0 else None
    avg_pass_rate = round(total_passed / (total_passed + total_failed) * 100, 1) if total_passed + total_failed > 0 else None

    return DashboardSummary(
        total_test_cases=total_tc or 0, approved_count=approved or 0, pending_count=pending or 0,
        total_runs=total_runs or 0, last_run_pass_rate=last_run_pass_rate, avg_pass_rate=avg_pass_rate,
        total_passed=total_passed or 0, total_failed=total_failed or 0,
    )
