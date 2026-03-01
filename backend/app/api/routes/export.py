"""CSV/JSON export endpoints for evaluation results."""

import csv
import io
from uuid import UUID
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.evaluation_run import EvaluationRun as EvaluationRunRecord
from app.models.run_result import RunResult

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/runs/{run_id}/csv")
async def export_run_csv(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Export evaluation run results as CSV."""
    # Fetch run
    run_result = await db.execute(
        select(EvaluationRunRecord).where(EvaluationRunRecord.id == run_id)
    )
    run = run_result.scalar_one_or_none()
    if not run:
        return {"error": "Run not found"}

    # Fetch results
    results_q = await db.execute(
        select(RunResult).where(RunResult.evaluation_run_id == run_id)
    )
    results = results_q.scalars().all()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Test Case", "Passed", "Score", "Failure Reason", "CES Result ID"
    ])
    for r in results:
        writer.writerow([
            r.test_case_name or "N/A",
            "Yes" if r.passed else "No",
            r.score or "",
            r.failure_reason or "",
            r.ces_result_id or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=evaluation_run_{run_id}.csv"
        },
    )
