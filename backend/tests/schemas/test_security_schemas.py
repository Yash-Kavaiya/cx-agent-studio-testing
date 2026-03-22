import pytest
from pydantic import ValidationError
from app.schemas.schemas import (
    HFTokenUpdate, HFTokenStatusResponse,
    SecurityTestRunCreate, SecurityTestRunResponse,
    SecurityTestResultResponse, DatasetInfo
)

def test_hf_token_update_valid():
    token = HFTokenUpdate(token="hf_test_token")
    assert token.token == "hf_test_token"

def test_security_test_run_create_valid():
    run = SecurityTestRunCreate(
        project_id="uuid-string",
        dataset_id="deepset/prompt-injections",
        category="prompt_injection"
    )
    assert run.project_id == "uuid-string"
    assert run.config.sample_size == 100  # default

def test_security_test_run_create_with_config():
    run = SecurityTestRunCreate(
        project_id="uuid-string",
        dataset_id="test/dataset",
        category="jailbreaking",
        config={"sample_size": 50, "shuffle": False}
    )
    assert run.config.sample_size == 50
    assert run.config.shuffle is False

def test_dataset_info():
    info = DatasetInfo(
        id="deepset/prompt-injections",
        name="Deepset Prompt Injections",
        size=662,
        description="Binary classification dataset"
    )
    assert info.id == "deepset/prompt-injections"
