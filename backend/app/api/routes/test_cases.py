"""Test case management routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.test_case import (
    TestCase,
    TestCaseVersion,
    ApprovalRecord,
    ApprovalStatus,
    ApprovalAction,
)
from app.models.project import Project
from app.schemas.schemas import (
    TestCaseGenerateRequest,
    TestCaseFromDocxRequest,
    TestCaseResponse,
    TestCaseVersionResponse,
    ApprovalRequest,
    ApprovalResponse,
    TestCaseType,
)
from app.services.gemini_service import get_gemini_service
from app.services.ces_client import get_ces_client
from app.services.docx_parser import parse_docx

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])


@router.get("", response_model=List[TestCaseResponse])
async def list_test_cases(
    test_suite_id: Optional[UUID] = None,
    status_filter: Optional[ApprovalStatus] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """List all test cases, optionally filtered by test suite or status."""
    query = select(TestCase).options(selectinload(TestCase.versions))

    if test_suite_id:
        query = query.where(TestCase.test_suite_id == test_suite_id)
    if status_filter:
        query = query.where(TestCase.status == status_filter)

    result = await db.execute(query.order_by(TestCase.created_at.desc()))
    return result.scalars().all()


@router.post(
    "/generate", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED
)
async def generate_test_case(
    request: TestCaseGenerateRequest,
    test_suite_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Generate a test case from natural language input using Gemini."""
    # Get test suite and project
    result = await db.execute(select(Project).where(Project.id == test_suite_id))
    # For now, use test_suite_id directly as project id lookup
    # In production, would need TestSuite model

    gemini = get_gemini_service()
    ces = get_ces_client()

    # Determine test type
    test_type = (
        request.type_hint.value
        if request.type_hint
        else await gemini.classify_test_type(request.description)
    )

    # Get agent context if provided
    agent_context = None
    if request.agent_id:
        # Fetch agent details from CES
        try:
            # Assume agent_id is in format "projects/.../locations/.../apps/.../agents/..."
            agent_data = await ces.get_agent(
                request.agent_id.split("/apps/")[-1].split("/agents/")[0],
                request.agent_id.split("/agents/")[-1],
            )
            tools_data = await ces.list_tools(
                request.agent_id.split("/apps/")[-1].split("/agents/")[0]
            )
            agent_context = {"agent": agent_data, "tools": tools_data.get("tools", [])}
        except Exception:
            pass  # Continue without context

    # Generate test case
    generated = await gemini.generate_test_case(
        user_input=request.description,
        agent_context=agent_context,
        test_type=test_type,
    )

    # Create test case in database
    test_case = TestCase(
        test_suite_id=test_suite_id,
        name=generated.get("displayName", f"Test {test_type.title()}"),
        description=generated.get("description", request.description[:200]),
        type=TestCaseType.GOLDEN if test_type == "golden" else TestCaseType.SCENARIO,
        status=ApprovalStatus.DRAFT,
        source_type="text",
        original_input=request.description,
    )
    db.add(test_case)
    await db.flush()

    # Create first version
    version = TestCaseVersion(
        test_case_id=test_case.id,
        version_number=1,
        generated_json=generated,
    )
    db.add(version)
    await db.commit()
    await db.refresh(test_case)

    return test_case


@router.post(
    "/from-docx",
    response_model=List[TestCaseResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_test_cases_from_docx(
    file: UploadFile = File(...),
    test_suite_id: UUID = None,
    agent_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Generate multiple test cases from a Word document."""
    # Read and parse docx
    content = await file.read()
    docx_text = parse_docx(content)

    gemini = get_gemini_service()

    # Extract individual test requirements
    requirements = await gemini.extract_test_requirements(docx_text)

    test_cases = []
    for req in requirements:
        test_type = req.get("type_hint", "golden") or "golden"

        # Generate test case
        generated = await gemini.generate_test_case(
            user_input=req.get("description", ""),
            agent_context=None,  # Could fetch agent context here
            test_type=test_type,
        )

        test_case = TestCase(
            test_suite_id=test_suite_id,
            name=generated.get("displayName", f"Test {len(test_cases) + 1}"),
            description=generated.get("description", req.get("description", "")[:200]),
            type=TestCaseType.GOLDEN
            if test_type == "golden"
            else TestCaseType.SCENARIO,
            status=ApprovalStatus.DRAFT,
            source_type="docx",
            original_input=req.get("description", ""),
        )
        db.add(test_case)
        await db.flush()

        version = TestCaseVersion(
            test_case_id=test_case.id,
            version_number=1,
            generated_json=generated,
        )
        db.add(version)
        test_cases.append(test_case)

    await db.commit()
    return test_cases


@router.get("/{test_case_id}", response_model=TestCaseResponse)
async def get_test_case(
    test_case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Get a specific test case with its current version."""
    result = await db.execute(
        select(TestCase)
        .options(selectinload(TestCase.versions))
        .where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    return test_case


@router.get("/{test_case_id}/versions", response_model=List[TestCaseVersionResponse])
async def get_test_case_versions(
    test_case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Get all versions of a test case."""
    result = await db.execute(
        select(TestCaseVersion)
        .where(TestCaseVersion.test_case_id == test_case_id)
        .order_by(TestCaseVersion.version_number)
    )
    return result.scalars().all()


@router.post("/{test_case_id}/approve", response_model=ApprovalResponse)
async def approve_test_case(
    test_case_id: UUID,
    request: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Approve, retry, or deny a test case."""
    result = await db.execute(
        select(TestCase)
        .options(selectinload(TestCase.versions))
        .where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    # Record approval action
    approval_record = ApprovalRecord(
        test_case_id=test_case_id,
        version_number=test_case.current_version,
        action=ApprovalAction(request.action.value),
        user_email=user.email,
        feedback=request.feedback,
    )
    db.add(approval_record)

    if request.action == ApprovalAction.APPROVE:
        # TODO: Submit to CES API
        test_case.status = ApprovalStatus.APPROVED
        message = "Test case approved and ready for submission to CES"
        new_version = None
    elif request.action == ApprovalAction.RETRY:
        if not request.feedback:
            raise HTTPException(status_code=400, detail="Feedback required for retry")

        test_case.status = ApprovalStatus.RETRY

        # Generate new version with feedback
        gemini = get_gemini_service()

        # Get current version's generated JSON
        current_version = next(
            (
                v
                for v in test_case.versions
                if v.version_number == test_case.current_version
            ),
            None,
        )

        # Regenerate with feedback
        generated = await gemini.generate_test_case(
            user_input=test_case.original_input or "",
            test_type=test_case.type.value,
            retry_feedback=request.feedback,
        )

        # Create new version
        new_version = TestCaseVersion(
            test_case_id=test_case.id,
            version_number=test_case.current_version + 1,
            generated_json=generated,
            user_feedback=request.feedback,
        )
        db.add(new_version)
        test_case.current_version += 1
        test_case.status = ApprovalStatus.DRAFT

        message = (
            f"Test case sent for regeneration (version {new_version.version_number})"
        )
        new_version = new_version.version_number
    else:  # DENY
        test_case.status = ApprovalStatus.DENIED
        message = "Test case denied"
        new_version = None

    await db.commit()
    await db.refresh(test_case)

    return ApprovalResponse(
        test_case_id=test_case_id,
        action=request.action,
        new_status=test_case.status,
        message=message,
        new_version=new_version,
    )


@router.post("/{test_case_id}/submit", response_model=TestCaseResponse)
async def submit_test_case(
    test_case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Submit an approved test case to CES API."""
    result = await db.execute(
        select(TestCase)
        .options(selectinload(TestCase.versions))
        .where(TestCase.id == test_case_id)
    )
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    if test_case.status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=400, detail="Test case must be approved before submission"
        )

    ces = get_ces_client()

    # Get current version's generated JSON
    current_version = next(
        (
            v
            for v in test_case.versions
            if v.version_number == test_case.current_version
        ),
        None,
    )

    if not current_version:
        raise HTTPException(status_code=500, detail="No version found")

    try:
        # Extract app_id from project (would need Project model lookup)
        # For now, use a placeholder
        app_id = "placeholder"

        # Submit to CES
        ces_result = await ces.create_evaluation(app_id, current_version.generated_json)

        # Update test case
        test_case.ces_evaluation_id = ces_result.get("name")
        test_case.status = ApprovalStatus.SUBMITTED
        await db.commit()
        await db.refresh(test_case)

        return test_case
    except Exception as e:
        test_case.status = ApprovalStatus.ERROR
        await db.commit()
        raise HTTPException(
            status_code=500, detail=f"Failed to submit to CES: {str(e)}"
        )


@router.delete("/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_case(
    test_case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Delete a test case."""
    result = await db.execute(select(TestCase).where(TestCase.id == test_case_id))
    test_case = result.scalar_one_or_none()

    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    await db.delete(test_case)
    await db.commit()
