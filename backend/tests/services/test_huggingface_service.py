# backend/tests/services/test_huggingface_service.py
import pytest
from app.services.huggingface_service import (
    CURATED_DATASETS, get_datasets_by_category, parse_hf_url
)


def test_curated_datasets_structure():
    assert "prompt_injection" in CURATED_DATASETS
    assert "jailbreaking" in CURATED_DATASETS
    assert "toxicity" in CURATED_DATASETS
    assert "indirect_attack" in CURATED_DATASETS
    assert len(CURATED_DATASETS["prompt_injection"]) >= 1


def test_get_datasets_by_category():
    datasets = get_datasets_by_category()
    assert "prompt_injection" in datasets
    assert all(isinstance(d, dict) for d in datasets["prompt_injection"])


def test_parse_hf_url_valid():
    url = "https://huggingface.co/datasets/deepset/prompt-injections"
    dataset_id = parse_hf_url(url)
    assert dataset_id == "deepset/prompt-injections"


def test_parse_hf_url_invalid():
    url = "https://example.com/not-hf"
    dataset_id = parse_hf_url(url)
    assert dataset_id is None


def test_parse_hf_url_with_params():
    url = "https://huggingface.co/datasets/test/data?param=value"
    dataset_id = parse_hf_url(url)
    assert dataset_id is not None
