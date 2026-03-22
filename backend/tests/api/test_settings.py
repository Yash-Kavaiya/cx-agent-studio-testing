# backend/tests/api/test_settings.py
import pytest
from app.main import app


def test_settings_router_exists():
    routes = [r.path for r in app.routes]
    assert any("/api/settings" in str(r) for r in routes)


def test_hf_token_endpoints_exist():
    routes = [str(r.path) for r in app.routes]
    assert any("hf-token" in r for r in routes)
