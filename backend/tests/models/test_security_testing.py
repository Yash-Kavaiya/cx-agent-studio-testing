# backend/tests/models/test_security_testing.py
import pytest
from app.models.security_testing import SecurityTestRun, SecurityTestResult, DatasetCategory, SecurityTestState


def test_security_test_run_model_exists():
    assert SecurityTestRun.__tablename__ == "security_test_runs"


def test_security_test_result_model_exists():
    assert SecurityTestResult.__tablename__ == "security_test_results"


def test_dataset_category_enum():
    assert DatasetCategory.PROMPT_INJECTION.value == "prompt_injection"
    assert DatasetCategory.JAILBREAKING.value == "jailbreaking"
    assert DatasetCategory.TOXICITY.value == "toxicity"
    assert DatasetCategory.INDIRECT_ATTACK.value == "indirect_attack"


def test_security_test_state_enum():
    assert SecurityTestState.PENDING.value == "pending"
    assert SecurityTestState.RUNNING.value == "running"
    assert SecurityTestState.COMPLETED.value == "completed"
    assert SecurityTestState.ERROR.value == "error"
    assert SecurityTestState.CANCELLED.value == "cancelled"
