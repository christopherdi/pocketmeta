import hashlib
import hmac
import secrets
import time
from typing import Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

# Secret key used to sign tokens (can be stored in env vars in production)
SECRET_KEY = "pocketmeta_super_secret_local_dev_key"


def hash_password(password: str) -> str:
    """Hashes password with salt using PBKDF2 HMAC-SHA256."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    )
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$")
        check_key = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
        )
        return hmac.compare_digest(key_hex, check_key.hex())
    except Exception:
        return False


def create_access_token(user_id: int, username: str) -> str:
    """Creates a secure signed bearer token."""
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{username}:{timestamp}"
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{payload}:{signature}"


def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> User:
    """Validates bearer token and returns the current user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ")[1]
    try:
        parts = token.split(":")
        if len(parts) != 4:
            raise ValueError()

        user_id_str, username, timestamp, signature = parts
        payload = f"{user_id_str}:{username}:{timestamp}"
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")

        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if not user or user.username != username:
            raise ValueError("User not found")

        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")