# backend/tests/api/test_security_testing.py
import pytest
from app.main import app


def test_security_testing_router_exists():
    routes = [str(r.path) for r in app.routes]
    assert any("/api/security-testing" in r for r in routes)


def test_datasets_endpoint_exists():
    routes = [str(r.path) for r in app.routes]
    assert any("datasets" in r for r in routes)


def test_runs_endpoint_exists():
    routes = [str(r.path) for r in app.routes]
    assert any("runs" in r for r in routes)
