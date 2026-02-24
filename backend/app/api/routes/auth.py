"""Authentication routes - Google OAuth 2.0 flow."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token, get_current_user
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.schemas import TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


class GoogleTokenRequest(BaseModel):
    """Google OAuth ID token from frontend."""
    id_token: str


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleTokenRequest, db: AsyncSession = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests

    try:
        from app.core.config import get_settings
        settings = get_settings()
        idinfo = id_token.verify_oauth2_token(
            request.id_token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    email = idinfo.get("email")
    name = idinfo.get("name", email)
    picture = idinfo.get("picture")
    google_id = idinfo.get("sub")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=email, name=name, picture=picture, google_id=google_id, role=UserRole.TESTER)
        db.add(user)

    user.last_login = datetime.now(timezone.utc)
    user.picture = picture
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": email, "role": user.role.value})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    result = await db.execute(select(User).where(User.email == user.get("email")))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
