"""Live agent testing sessions."""

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.project import Project
from app.schemas.schemas import SessionMessage, SessionResponse
from app.services.ces_client import get_ces_client

router = APIRouter(prefix="/sessions", tags=["Live Sessions"])


@router.post("/{project_id}/chat", response_model=SessionResponse)
async def chat_with_agent(
    project_id: UUID, message: SessionMessage, session_id: str = None,
    db: AsyncSession = Depends(get_db), user=Depends(get_current_user),
):
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    app_id = project.ces_app_name.split("/apps/")[-1]
    ces = get_ces_client()
    if not session_id:
        session_id = str(uuid4())

    config = {
        "config": {"session": f"{project.ces_app_name}/sessions/{session_id}", "timeZone": message.time_zone},
        "inputs": [{"text": message.text}],
    }
    if message.entry_agent:
        config["config"]["entryAgent"] = message.entry_agent

    try:
        response = await ces.run_session(app_id, session_id, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session error: {str(e)}")

    return SessionResponse(outputs=response.get("outputs", []), session_id=session_id)
