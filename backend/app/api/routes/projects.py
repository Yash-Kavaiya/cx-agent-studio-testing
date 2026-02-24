"""Project management routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.project import Project
from app.schemas.schemas import ProjectCreate, ProjectResponse
from app.services.ces_client import get_ces_client

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    result = await db.execute(select(Project).where(Project.is_active == True))
    return result.scalars().all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    ces = get_ces_client()
    try:
        app_id = project.ces_app_name.split("/apps/")[-1]
        app_data = await ces.get_app(app_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not reach CES app: {str(e)}")

    db_project = Project(
        name=project.name, description=project.description,
        gcp_project_id=project.gcp_project_id, gcp_location=project.gcp_location,
        ces_app_name=project.ces_app_name,
        ces_app_display_name=app_data.get("displayName", project.ces_app_display_name),
    )
    db.add(db_project)
    await db.flush()
    await db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/ces-agents")
async def list_ces_agents(project_id: UUID, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    ces = get_ces_client()
    app_id = project.ces_app_name.split("/apps/")[-1]
    return await ces.list_agents(app_id)
