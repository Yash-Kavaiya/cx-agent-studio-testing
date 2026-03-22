# backend/tests/models/test_user_settings.py
import pytest
from app.models.user_settings import UserSettings


def test_user_settings_model_exists():
    assert UserSettings.__tablename__ == "user_settings"


def test_user_settings_has_required_columns():
    columns = [c.name for c in UserSettings.__table__.columns]
    assert "id" in columns
    assert "user_id" in columns
    assert "hf_token_encrypted" in columns
    assert "created_at" in columns
    assert "updated_at" in columns
