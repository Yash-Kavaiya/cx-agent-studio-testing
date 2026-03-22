"""Fernet encryption utilities for secure token storage."""

import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


def _get_fernet() -> Fernet:
    """Derive Fernet key from SECRET_KEY using PBKDF2."""
    key = hashlib.pbkdf2_hmac(
        'sha256',
        settings.SECRET_KEY.encode(),
        b'hf_token_salt',
        100000,
        dklen=32
    )
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_token(token: str) -> str:
    """Encrypt a token string using Fernet (AES-128-CBC)."""
    fernet = _get_fernet()
    encrypted = fernet.encrypt(token.encode())
    return encrypted.decode()


def decrypt_token(encrypted: str) -> str:
    """Decrypt an encrypted token string."""
    fernet = _get_fernet()
    try:
        decrypted = fernet.decrypt(encrypted.encode())
        return decrypted.decode()
    except InvalidToken as e:
        raise ValueError("Invalid or corrupted encrypted token") from e
