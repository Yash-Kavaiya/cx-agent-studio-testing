"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class TestCaseType(str, Enum):
    GOLDEN = "golden"
    SCENARIO = "scenario"

class ApprovalStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    RETRY = "retry"
    DENIED = "denied"
    SUBMITTED = "submitted"
    ERROR = "error"

class ApprovalAction(str, Enum):
    APPROVE = "approve"
    RETRY = "retry"
    DENY = "deny"

class RunState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    gcp_project_id: str
    gcp_location: str = "us-central1"
    ces_app_name: str = Field(..., description="Full CES app resource name")
    ces_app_display_name: Optional[str] = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    gcp_project_id: str
    gcp_location: str
    ces_app_name: str
    ces_app_display_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class TestSuiteCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: List[str] = []

class TestSuiteResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    tags: List[str]
    ces_dataset_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    test_case_count: Optional[int] = 0
    class Config:
        from_attributes = True

class TestCaseGenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, description="Natural language test requirement")
    type_hint: Optional[TestCaseType] = None
    agent_id: Optional[str] = None

class TestCaseFromDocxRequest(BaseModel):
    agent_id: Optional[str] = None

class TestCaseResponse(BaseModel):
    id: UUID
    test_suite_id: UUID
    name: str
    description: Optional[str]
    type: TestCaseType
    status: ApprovalStatus
    ces_evaluation_id: Optional[str]
    source_type: str
    original_input: Optional[str]
    current_version: int
    generated_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class TestCaseVersionResponse(BaseModel):
    id: UUID
    test_case_id: UUID
    version_number: int
    generated_json: Dict[str, Any]
    user_feedback: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    action: ApprovalAction
    feedback: Optional[str] = Field(None, description="Required for retry, optional for deny")

class ApprovalResponse(BaseModel):
    test_case_id: UUID
    action: ApprovalAction
    new_status: ApprovalStatus
    message: str
    new_version: Optional[int] = None

class RunEvaluationRequest(BaseModel):
    evaluation_ids: Optional[List[str]] = None
    use_dataset: bool = False
    app_version: Optional[str] = None
    run_count: int = 1
    generate_latency_report: bool = True

class EvaluationRunResponse(BaseModel):
    id: UUID
    test_suite_id: UUID
    ces_run_id: Optional[str]
    state: RunState
    evaluation_type: Optional[str]
    total_count: int
    passed_count: int
    failed_count: int
    error_count: int
    latency_report: Optional[Dict]
    ai_analysis: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    pass_rate: Optional[float] = None
    class Config:
        from_attributes = True

class RunResultResponse(BaseModel):
    id: UUID
    evaluation_run_id: UUID
    ces_result_id: Optional[str]
    test_case_name: Optional[str]
    passed: Optional[bool]
    score: Optional[float]
    failure_reason: Optional[str]
    diagnostics: Optional[Dict]
    conversation_log: Optional[Dict]
    created_at: datetime
    class Config:
        from_attributes = True

class SessionMessage(BaseModel):
    text: str
    entry_agent: Optional[str] = None
    time_zone: str = "America/Los_Angeles"

class SessionResponse(BaseModel):
    outputs: List[Dict[str, Any]]
    session_id: str

class DashboardSummary(BaseModel):
    total_test_cases: int
    approved_count: int
    pending_count: int
    total_runs: int
    last_run_pass_rate: Optional[float]
    avg_pass_rate: Optional[float]
    total_passed: int
    total_failed: int

class AIAnalysisRequest(BaseModel):
    run_id: UUID
    question: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    analysis: str
    run_id: UUID

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    picture: Optional[str]
    role: str
    is_active: bool
    class Config:
        from_attributes = True


# ─── Security Testing Schemas ────────────────────────────────

class DatasetCategory(str, Enum):
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAKING = "jailbreaking"
    TOXICITY = "toxicity"
    INDIRECT_ATTACK = "indirect_attack"


class SecurityTestState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


class HFTokenUpdate(BaseModel):
    token: str = Field(..., min_length=1)


class HFTokenStatusResponse(BaseModel):
    configured: bool
    last_updated: Optional[datetime] = None


class SecurityTestConfig(BaseModel):
    sample_size: int = Field(default=100, ge=1, le=10000)
    batch_size: int = Field(default=10, ge=1, le=100)
    timeout_per_prompt: int = Field(default=30, ge=1, le=120)
    shuffle: bool = True


class SecurityTestRunCreate(BaseModel):
    project_id: str
    name: Optional[str] = None
    dataset_id: str
    category: DatasetCategory
    config: SecurityTestConfig = Field(default_factory=SecurityTestConfig)


class SecurityTestRunResponse(BaseModel):
    id: str  # String UUID to match model
    project_id: str
    name: str
    dataset_source: str
    dataset_category: DatasetCategory
    state: SecurityTestState
    config: Optional[Dict[str, Any]]
    total_prompts: int
    completed_prompts: int
    attack_success_count: int
    attack_success_rate: Optional[float]
    ces_session_id: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SecurityTestResultResponse(BaseModel):
    id: str  # String UUID to match model
    security_test_run_id: str
    prompt_text: str
    prompt_category: Optional[str]
    agent_response: Optional[str]
    is_attack_successful: bool
    detection_method: Optional[str]
    confidence_score: Optional[float]
    latency_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetInfo(BaseModel):
    id: str
    name: str
    size: int
    description: str


class DatasetValidateRequest(BaseModel):
    dataset_url: str


class DatasetValidateResponse(BaseModel):
    valid: bool
    name: Optional[str] = None
    size: Optional[int] = None
    columns: Optional[List[str]] = None
    error: Optional[str] = None
