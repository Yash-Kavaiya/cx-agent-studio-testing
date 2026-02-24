"""TestCase, TestCaseVersion, and ApprovalRecord models."""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TestCaseType(str, enum.Enum):
    GOLDEN = "golden"
    SCENARIO = "scenario"

class ApprovalStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    RETRY = "retry"
    DENIED = "denied"
    SUBMITTED = "submitted"
    ERROR = "error"

class ApprovalAction(str, enum.Enum):
    APPROVE = "approve"
    RETRY = "retry"
    DENY = "deny"


class TestCase(Base):
    __tablename__ = "test_cases"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_suite_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("test_suites.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    type: Mapped[TestCaseType] = mapped_column(Enum(TestCaseType), nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.DRAFT)
    ces_evaluation_id: Mapped[str] = mapped_column(String(500), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), default="text")
    original_input: Mapped[str] = mapped_column(Text, nullable=True)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    test_suite = relationship("TestSuite", back_populates="test_cases")
    versions = relationship("TestCaseVersion", back_populates="test_case", cascade="all, delete-orphan", order_by="TestCaseVersion.version_number")
    approval_records = relationship("ApprovalRecord", back_populates="test_case", cascade="all, delete-orphan")


class TestCaseVersion(Base):
    __tablename__ = "test_case_versions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("test_cases.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    gemini_prompt: Mapped[str] = mapped_column(Text, nullable=True)
    gemini_response_raw: Mapped[str] = mapped_column(Text, nullable=True)
    user_feedback: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    test_case = relationship("TestCase", back_populates="versions")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("test_cases.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[ApprovalAction] = mapped_column(Enum(ApprovalAction), nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    test_case = relationship("TestCase", back_populates="approval_records")
