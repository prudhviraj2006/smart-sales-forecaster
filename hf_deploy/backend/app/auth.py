"""
API Key authentication dependency.
Fixes: C-1 (No Authentication), C-3 (Unauthenticated Deletion), H-3 (IDOR)

If API_SECRET_KEY env var is not set, auth is bypassed (dev mode).
Set API_SECRET_KEY in production to enforce authentication.
"""
import os
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    expected_key = os.environ.get("API_SECRET_KEY")

    # Dev mode: if no secret key configured, skip auth
    if not expected_key:
        return "dev-mode"

    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key.")

    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid API key.")

    return api_key
