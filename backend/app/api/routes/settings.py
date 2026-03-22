"""Settings router for user configuration management."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.encryption import encrypt_token
from app.core.auth import get_current_user
from app.models.user_settings import UserSettings
from app.schemas.schemas import HFTokenUpdate, HFTokenStatusResponse

router = APIRouter(prefix="/settings", tags=["settings"])


async def get_or_create_user_settings(
    db: AsyncSession, user_id: str
) -> UserSettings:
    """Get existing settings or create new ones for user."""
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.put("/hf-token")
async def update_hf_token(
    data: HFTokenUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Update the user's HuggingFace token."""
    user_id = user.get("sub")
    settings = await get_or_create_user_settings(db, user_id)
    settings.hf_token_encrypted = encrypt_token(data.token)
    settings.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"success": True, "updated_at": settings.updated_at.isoformat()}


@router.get("/hf-token/status", response_model=HFTokenStatusResponse)
async def get_hf_token_status(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Check if HuggingFace token is configured."""
    user_id = user.get("sub")
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()

    if not settings or not settings.hf_token_encrypted:
        return HFTokenStatusResponse(configured=False)

    return HFTokenStatusResponse(
        configured=True,
        last_updated=settings.updated_at
    )


@router.delete("/hf-token")
async def delete_hf_token(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Remove the user's HuggingFace token."""
    user_id = user.get("sub")
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()

    if settings:
        settings.hf_token_encrypted = None
        settings.updated_at = datetime.now(timezone.utc)
        await db.commit()

    return {"success": True}
