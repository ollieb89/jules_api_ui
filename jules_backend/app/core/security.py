from __future__ import annotations

import binascii
import hashlib
import secrets
from dataclasses import dataclass

from fastapi import Depends

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.models.user import UserRole


@dataclass(frozen=True)
class CurrentUser:
    id: int
    email: str
    role: UserRole


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${binascii.hexlify(digest).decode('utf-8')}"


async def get_current_user() -> CurrentUser:
    return CurrentUser(id=1, email="admin@example.com", role=UserRole.admin)


async def require_auth(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user is None:
        raise UnauthorizedError("Authentication required")
    return current_user


async def require_admin(current_user: CurrentUser = Depends(require_auth)) -> CurrentUser:
    if current_user.role != UserRole.admin:
        raise ForbiddenError("Admin access required")
    return current_user
