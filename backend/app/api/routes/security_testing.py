"""Security testing router for red-teaming CX agents."""

import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.core.encryption import decrypt_token
from app.core.auth import get_current_user
from app.models.project import Project
from app.models.user_settings import UserSettings
from app.models.security_testing import SecurityTestRun, SecurityTestResult, SecurityTestState, DatasetCategory
from app.services.huggingface_service import get_datasets_by_category, validate_dataset, load_prompts_from_dataset, parse_hf_url
from app.services.attack_detector import detect_attack_success
from app.services.ces_client import CESClient
from app.schemas.schemas import (
    SecurityTestRunCreate, SecurityTestRunResponse, SecurityTestResultResponse,
    DatasetValidateRequest, DatasetValidateResponse
)

router = APIRouter(prefix="/security-testing", tags=["security-testing"])


@router.get("/datasets")
async def list_datasets():
    """Return curated security testing datasets by category."""
    return get_datasets_by_category()


@router.post("/validate-dataset", response_model=DatasetValidateResponse)
async def validate_custom_dataset(
    data: DatasetValidateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Validate a custom HuggingFace dataset URL."""
    dataset_id = parse_hf_url(data.dataset_url)
    if not dataset_id:
        dataset_id = data.dataset_url  # Try as direct ID

    # Get HF token if available
    user_id = user.get("sub")
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    hf_token = None
    if settings and settings.hf_token_encrypted:
        hf_token = decrypt_token(settings.hf_token_encrypted)

    validation = await validate_dataset(dataset_id, hf_token)
    return DatasetValidateResponse(**validation)


@router.post("/runs", response_model=SecurityTestRunResponse)
async def create_security_test_run(
    data: SecurityTestRunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Create and start a new security test run."""
    user_id = user.get("sub")

    # Verify project access
    result = await db.execute(
        select(Project).where(Project.id == data.project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check HF token
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    if not settings or not settings.hf_token_encrypted:
        raise HTTPException(
            status_code=400,
            detail="HuggingFace token not configured. Please add it in Settings."
        )

    # Count existing runs for auto-naming
    result = await db.execute(
        select(func.count()).select_from(SecurityTestRun).where(
            SecurityTestRun.project_id == data.project_id,
            SecurityTestRun.dataset_source == data.dataset_id
        )
    )
    run_count = result.scalar() + 1

    # Auto-generate name if not provided
    name = data.name or f"{data.dataset_id.split('/')[-1]} Run #{run_count}"

    # Create run record
    run = SecurityTestRun(
        project_id=data.project_id,
        name=name,
        dataset_source=data.dataset_id,
        dataset_category=DatasetCategory(data.category.value),
        state=SecurityTestState.PENDING,
        config=data.config.model_dump() if data.config else {},
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Queue background task
    background_tasks.add_task(run_security_test, run.id, user_id)

    return run


async def run_security_test(run_id: str, user_id: str):
    """Background task to execute security test."""
    async with AsyncSessionLocal() as db:
        run = None  # Initialize to None for error handling
        try:
            # Load run with project
            result = await db.execute(
                select(SecurityTestRun)
                .options(selectinload(SecurityTestRun.project))
                .where(SecurityTestRun.id == run_id)
            )
            run = result.scalar_one()

            # Get HF token
            result = await db.execute(
                select(UserSettings).where(UserSettings.user_id == user_id)
            )
            settings = result.scalar_one()
            hf_token = decrypt_token(settings.hf_token_encrypted)

            # Update state to running
            run.state = SecurityTestState.RUNNING
            run.started_at = datetime.now(timezone.utc)
            await db.commit()

            # Load prompts
            config = run.config or {}
            prompts = await load_prompts_from_dataset(
                run.dataset_source,
                sample_size=config.get("sample_size", 100),
                shuffle=config.get("shuffle", True),
                hf_token=hf_token
            )

            run.total_prompts = len(prompts)
            await db.commit()

            # Initialize CES client
            ces_client = CESClient()
            app_name = run.project.ces_app_name

            # Create CES session using run_session with first prompt
            first_prompt = prompts[0]["text"] if prompts else "Hello"
            session_response = await ces_client.run_session(app_name, {
                "sessionConfig": {},
                "sessionInput": {"query": {"text": first_prompt}}
            })
            session_id = session_response.get("sessionId", "")
            if not session_id:
                # Fallback: extract from session name if available
                session_name = session_response.get("session", {}).get("name", "")
                session_id = session_name.split("/")[-1] if session_name else f"sec-test-{run.id[:8]}"
            run.ces_session_id = session_id
            await db.commit()

            # Initialize counters before processing any prompts
            attack_count = 0

            # Process first prompt result (already sent via run_session)
            if prompts:
                start_time = datetime.now(timezone.utc)
                agent_response = ""
                outputs = session_response.get("sessionOutput", {}).get("outputs", [])
                for output in outputs:
                    if "text" in output:
                        agent_response += output["text"]

                latency = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
                is_successful, confidence = detect_attack_success(first_prompt, agent_response)
                if is_successful:
                    attack_count += 1

                result_record = SecurityTestResult(
                    security_test_run_id=run.id,
                    prompt_text=first_prompt,
                    prompt_category=prompts[0].get("category"),
                    agent_response=agent_response,
                    is_attack_successful=is_successful,
                    detection_method="keyword",
                    confidence_score=confidence,
                    latency_ms=latency,
                )
                db.add(result_record)
                run.completed_prompts = 1
                prompts = prompts[1:]  # Skip first prompt in loop

            # Process remaining prompts
            batch_size = config.get("batch_size", 10)
            timeout = config.get("timeout_per_prompt", 30)
            start_index = run.completed_prompts  # Already processed some

            for i, prompt_data in enumerate(prompts, start=start_index):
                # Check for cancellation
                await db.refresh(run)
                if run.state == SecurityTestState.CANCELLED:
                    break

                prompt_text = prompt_data["text"]
                start_time = datetime.now(timezone.utc)

                try:
                    # Send prompt via detect_intent
                    response = await asyncio.wait_for(
                        ces_client.detect_intent(
                            app_name,
                            session_id,
                            {"queryInput": {"text": {"text": prompt_text}}}
                        ),
                        timeout=timeout
                    )

                    # Extract response text
                    agent_response = ""
                    if "queryResult" in response:
                        messages = response["queryResult"].get("responseMessages", [])
                        for msg in messages:
                            if "text" in msg:
                                agent_response += " ".join(msg["text"].get("text", []))

                    latency = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

                    # Detect attack success
                    is_successful, confidence = detect_attack_success(prompt_text, agent_response)

                    if is_successful:
                        attack_count += 1

                    # Store result
                    result_record = SecurityTestResult(
                        security_test_run_id=run.id,
                        prompt_text=prompt_text,
                        prompt_category=prompt_data.get("category"),
                        agent_response=agent_response,
                        is_attack_successful=is_successful,
                        detection_method="keyword",
                        confidence_score=confidence,
                        latency_ms=latency,
                    )
                    db.add(result_record)

                except asyncio.TimeoutError:
                    result_record = SecurityTestResult(
                        security_test_run_id=run.id,
                        prompt_text=prompt_text,
                        prompt_category=prompt_data.get("category"),
                        agent_response="[TIMEOUT]",
                        is_attack_successful=False,
                        detection_method="timeout",
                        confidence_score=0.0,
                    )
                    db.add(result_record)
                except Exception as e:
                    result_record = SecurityTestResult(
                        security_test_run_id=run.id,
                        prompt_text=prompt_text,
                        prompt_category=prompt_data.get("category"),
                        agent_response=f"[ERROR: {str(e)}]",
                        is_attack_successful=False,
                        detection_method="error",
                        confidence_score=0.0,
                    )
                    db.add(result_record)

                # Update progress
                run.completed_prompts = i + 1
                run.attack_success_count = attack_count
                if run.completed_prompts > 0:
                    run.attack_success_rate = (attack_count / run.completed_prompts) * 100

                # Commit every batch
                if (i + 1) % batch_size == 0:
                    await db.commit()

            # Final update
            run.state = SecurityTestState.COMPLETED
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            if run is not None:
                run.state = SecurityTestState.ERROR
                run.completed_at = datetime.now(timezone.utc)
                await db.commit()
            # Log the error (in production, use proper logging)
            print(f"Security test {run_id} failed: {e}")
            raise


@router.get("/runs")
async def list_security_test_runs(
    project_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """List security test runs for a project."""
    result = await db.execute(
        select(SecurityTestRun)
        .where(SecurityTestRun.project_id == project_id)
        .order_by(SecurityTestRun.created_at.desc())
        .limit(limit)
    )
    runs = result.scalars().all()

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(SecurityTestRun)
        .where(SecurityTestRun.project_id == project_id)
    )
    total = count_result.scalar()

    return {"runs": runs, "total": total}


async def verify_run_access(run_id: str, db: AsyncSession) -> SecurityTestRun:
    """Helper to load run and verify it exists."""
    result = await db.execute(
        select(SecurityTestRun)
        .options(selectinload(SecurityTestRun.project))
        .where(SecurityTestRun.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/runs/{run_id}", response_model=SecurityTestRunResponse)
async def get_security_test_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get details of a security test run."""
    run = await verify_run_access(run_id, db)
    return run


@router.get("/runs/{run_id}/results")
async def get_security_test_results(
    run_id: str,
    filter: str = Query("all", pattern="^(all|successful_attacks|blocked|low_confidence)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get results for a security test run with filtering."""
    query = select(SecurityTestResult).where(SecurityTestResult.security_test_run_id == run_id)

    # Apply filter
    if filter == "successful_attacks":
        query = query.where(SecurityTestResult.is_attack_successful == True)
    elif filter == "blocked":
        query = query.where(
            SecurityTestResult.is_attack_successful == False,
            SecurityTestResult.confidence_score >= 0.7
        )
    elif filter == "low_confidence":
        query = query.where(SecurityTestResult.confidence_score < 0.7)

    # Get total count
    count_query = select(func.count()).select_from(SecurityTestResult).where(
        SecurityTestResult.security_test_run_id == run_id
    )
    if filter != "all":
        if filter == "successful_attacks":
            count_query = count_query.where(SecurityTestResult.is_attack_successful == True)
        elif filter == "blocked":
            count_query = count_query.where(
                SecurityTestResult.is_attack_successful == False,
                SecurityTestResult.confidence_score >= 0.7
            )
        elif filter == "low_confidence":
            count_query = count_query.where(SecurityTestResult.confidence_score < 0.7)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(SecurityTestResult.created_at).offset(offset).limit(per_page)

    result = await db.execute(query)
    results = result.scalars().all()

    return {"results": results, "total": total, "page": page}


@router.post("/runs/{run_id}/cancel")
async def cancel_security_test_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Cancel a running security test."""
    run = await verify_run_access(run_id, db)

    if run.state not in [SecurityTestState.PENDING, SecurityTestState.RUNNING]:
        raise HTTPException(status_code=400, detail="Run cannot be cancelled")

    run.state = SecurityTestState.CANCELLED
    run.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return {"success": True, "state": run.state.value}


@router.delete("/runs/{run_id}", status_code=204)
async def delete_security_test_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Delete a security test run and its results."""
    run = await verify_run_access(run_id, db)

    await db.delete(run)
    await db.commit()
