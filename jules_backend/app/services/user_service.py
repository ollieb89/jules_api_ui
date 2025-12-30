from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.pagination import PaginationParams
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    async def list_users(
        self, db: AsyncSession, params: PaginationParams
    ) -> tuple[list[User], int]:
        return await self._repository.list_users_paginated(db, params)

    async def get_user(self, db: AsyncSession, user_id: int) -> User:
        user = await self._repository.get_user_by_id(db, user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    async def create_user(self, db: AsyncSession, payload: UserCreate) -> User:
        existing = await self._repository.get_user_by_email(db, payload.email)
        if existing:
            raise ConflictError("Email already exists")

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=payload.is_active,
        )

        try:
            return await self._repository.create_user(db, user)
        except IntegrityError as exc:
            raise ConflictError("Email already exists") from exc

    async def update_user(self, db: AsyncSession, user_id: int, payload: UserUpdate) -> User:
        user = await self._repository.get_user_by_id(db, user_id)
        if user is None:
            raise NotFoundError("User not found")

        if payload.email is not None and payload.email != user.email:
            existing = await self._repository.get_user_by_email(db, payload.email)
            if existing and existing.id != user_id:
                raise ConflictError("Email already exists")
            user.email = payload.email

        if payload.role is not None:
            user.role = payload.role

        if payload.is_active is not None:
            user.is_active = payload.is_active

        if payload.password is not None:
            user.hashed_password = hash_password(payload.password)

        try:
            return await self._repository.update_user(db, user)
        except IntegrityError as exc:
            raise ConflictError("Email already exists") from exc

    async def delete_user(self, db: AsyncSession, user_id: int) -> None:
        user = await self._repository.get_user_by_id(db, user_id)
        if user is None:
            raise NotFoundError("User not found")
        await self._repository.delete_user(db, user)
