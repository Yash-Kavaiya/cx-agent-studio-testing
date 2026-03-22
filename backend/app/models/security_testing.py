"""SecurityTestRun and SecurityTestResult models for security testing."""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer, Float, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class DatasetCategory(str, enum.Enum):
    """Categories of security test datasets."""
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAKING = "jailbreaking"
    TOXICITY = "toxicity"
    INDIRECT_ATTACK = "indirect_attack"


class SecurityTestState(str, enum.Enum):
    """State of a security test run."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


class SecurityTestRun(Base):
    """Model for tracking security test run executions."""
    __tablename__ = "security_test_runs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_source: Mapped[str] = mapped_column(String(500), nullable=True)
    dataset_category: Mapped[DatasetCategory] = mapped_column(
        Enum(DatasetCategory), nullable=True
    )
    state: Mapped[SecurityTestState] = mapped_column(
        Enum(SecurityTestState), default=SecurityTestState.PENDING
    )
    config: Mapped[dict] = mapped_column(JSON, nullable=True)
    total_prompts: Mapped[int] = mapped_column(Integer, default=0)
    completed_prompts: Mapped[int] = mapped_column(Integer, default=0)
    attack_success_count: Mapped[int] = mapped_column(Integer, default=0)
    attack_success_rate: Mapped[float] = mapped_column(Float, nullable=True)
    ces_session_id: Mapped[str] = mapped_column(String(500), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    project = relationship("Project", back_populates="security_test_runs")
    results = relationship(
        "SecurityTestResult", back_populates="security_test_run", cascade="all, delete-orphan"
    )


class SecurityTestResult(Base):
    """Model for individual security test results."""
    __tablename__ = "security_test_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    security_test_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("security_test_runs.id"), nullable=False
    )
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_category: Mapped[str] = mapped_column(String(100), nullable=True)
    agent_response: Mapped[str] = mapped_column(Text, nullable=True)
    is_attack_successful: Mapped[bool] = mapped_column(nullable=True)
    detection_method: Mapped[str] = mapped_column(String(100), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=True)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    security_test_run = relationship("SecurityTestRun", back_populates="results")
