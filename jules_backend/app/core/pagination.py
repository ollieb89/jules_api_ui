from __future__ import annotations

from fastapi import Query
from pydantic import BaseModel, Field

from app.schemas.common import PaginationMeta


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


def get_pagination_params(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, per_page=per_page)


def build_pagination_meta(params: PaginationParams, total: int) -> PaginationMeta:
    total_pages = 0 if total == 0 else (total + params.per_page - 1) // params.per_page
    return PaginationMeta(
        page=params.page,
        per_page=params.per_page,
        total=total,
        total_pages=total_pages,
    )
