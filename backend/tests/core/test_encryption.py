# backend/tests/core/test_encryption.py
import pytest
from app.core.encryption import encrypt_token, decrypt_token


def test_encrypt_decrypt_roundtrip():
    original = "hf_test_token_12345"
    encrypted = encrypt_token(original)
    assert encrypted != original
    assert decrypt_token(encrypted) == original


def test_encrypted_token_is_string():
    encrypted = encrypt_token("hf_abc")
    assert isinstance(encrypted, str)


def test_decrypt_invalid_raises():
    with pytest.raises(Exception):
        decrypt_token("not-a-valid-encrypted-string")
