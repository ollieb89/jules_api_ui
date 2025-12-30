from __future__ import annotations

from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams
from app.models.user import User


class UserRepository:
    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def list_users_paginated(
        self, db: AsyncSession, params: PaginationParams
    ) -> tuple[list[User], int]:
        total_result = await db.execute(select(func.count()).select_from(User))
        total = int(total_result.scalar_one())

        result = await db.execute(
            select(User).order_by(User.id).offset(params.offset).limit(params.per_page)
        )
        users = list(result.scalars().all())
        return users, total

    async def create_user(self, db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def update_user(self, db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def delete_user(self, db: AsyncSession, user: User) -> None:
        await db.delete(user)
        await db.commit()
