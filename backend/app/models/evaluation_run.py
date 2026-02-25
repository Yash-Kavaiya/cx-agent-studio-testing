"""EvaluationRun and RunResult models."""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer, Boolean, Float, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class RunState(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


class EvaluationRunRecord(Base):
    __tablename__ = "evaluation_runs"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    test_suite_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_suites.id"), nullable=False
    )
    ces_run_id: Mapped[str] = mapped_column(String(500), nullable=True)
    ces_operation_id: Mapped[str] = mapped_column(String(500), nullable=True)
    state: Mapped[RunState] = mapped_column(Enum(RunState), default=RunState.PENDING)
    app_version: Mapped[str] = mapped_column(String(500), nullable=True)
    evaluation_type: Mapped[str] = mapped_column(String(20), nullable=True)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    passed_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    pass_rate: Mapped[float] = mapped_column(Float, nullable=True)
    latency_report: Mapped[dict] = mapped_column(JSONB, nullable=True)
    ai_analysis: Mapped[str] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    test_suite = relationship("TestSuite", back_populates="evaluation_runs")
    results = relationship(
        "RunResultRecord", back_populates="evaluation_run", cascade="all, delete-orphan"
    )


class RunResultRecord(Base):
    __tablename__ = "run_results"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    evaluation_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluation_runs.id"), nullable=False
    )
    ces_result_id: Mapped[str] = mapped_column(String(500), nullable=True)
    ces_evaluation_id: Mapped[str] = mapped_column(String(500), nullable=True)
    test_case_name: Mapped[str] = mapped_column(String(255), nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=True)
    diagnostics: Mapped[dict] = mapped_column(JSONB, nullable=True)
    conversation_log: Mapped[dict] = mapped_column(JSONB, nullable=True)
    failure_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    evaluation_run = relationship("EvaluationRunRecord", back_populates="results")
