from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, build_pagination_meta, get_pagination_params
from app.core.security import require_admin, require_auth
from app.dependencies import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.common import ResponseEnvelope, ResponseMeta
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService


router = APIRouter(prefix="/v1/users", tags=["users"])
user_service = UserService(UserRepository())


@router.get(
    "/",
    response_model=ResponseEnvelope[list[UserResponse]],
    summary="List users",
)
async def list_users(
    pagination: PaginationParams = Depends(get_pagination_params),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_auth),
) -> ResponseEnvelope[list[UserResponse]]:
    """List users with pagination."""
    users, total = await user_service.list_users(db, pagination)
    data = [UserResponse.model_validate(user) for user in users]
    meta = ResponseMeta(
        timestamp=datetime.now(timezone.utc),
        version="v1",
        pagination=build_pagination_meta(pagination, total),
    )
    return ResponseEnvelope(success=True, data=data, meta=meta)


@router.get(
    "/{user_id}",
    response_model=ResponseEnvelope[UserResponse],
    summary="Get user by ID",
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_auth),
) -> ResponseEnvelope[UserResponse]:
    """Get a user by ID."""
    user = await user_service.get_user(db, user_id)
    data = UserResponse.model_validate(user)
    meta = ResponseMeta(timestamp=datetime.now(timezone.utc), version="v1")
    return ResponseEnvelope(success=True, data=data, meta=meta)


@router.post(
    "/",
    response_model=ResponseEnvelope[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_admin),
) -> ResponseEnvelope[UserResponse]:
    """Create a new user."""
    user = await user_service.create_user(db, payload)
    data = UserResponse.model_validate(user)
    meta = ResponseMeta(timestamp=datetime.now(timezone.utc), version="v1")
    return ResponseEnvelope(success=True, data=data, meta=meta)


@router.patch(
    "/{user_id}",
    response_model=ResponseEnvelope[UserResponse],
    summary="Update a user",
)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_admin),
) -> ResponseEnvelope[UserResponse]:
    """Update a user by ID."""
    user = await user_service.update_user(db, user_id, payload)
    data = UserResponse.model_validate(user)
    meta = ResponseMeta(timestamp=datetime.now(timezone.utc), version="v1")
    return ResponseEnvelope(success=True, data=data, meta=meta)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user",
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_admin),
) -> Response:
    """Delete a user by ID."""
    await user_service.delete_user(db, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
