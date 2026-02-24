"""CX Agent Studio Testing Platform - FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    await init_db()
    yield


app = FastAPI(
    title="CX Agent Studio Testing Platform",
    description="AI-powered testing platform for Dialogflow CX agents using CES v1beta APIs",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.api.routes.auth import router as auth_router          # noqa: E402
from app.api.routes.projects import router as projects_router  # noqa: E402
from app.api.routes.test_cases import router as test_cases_router  # noqa: E402
from app.api.routes.evaluations import router as evaluations_router  # noqa: E402
from app.api.routes.sessions import router as sessions_router  # noqa: E402
from app.api.routes.dashboard import router as dashboard_router  # noqa: E402

app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(test_cases_router, prefix="/api")
app.include_router(evaluations_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "cx-agent-studio-testing"}
