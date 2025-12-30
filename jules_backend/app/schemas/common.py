from __future__ import annotations

from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class ResponseMeta(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str
    pagination: Optional[PaginationMeta] = None


class ErrorDetail(BaseModel):
    type: str
    title: str
    detail: str
    status: int
    instance: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


DataT = TypeVar("DataT")


class ResponseEnvelope(BaseModel, Generic[DataT]):
    success: bool = True
    data: DataT
    meta: ResponseMeta

    model_config = ConfigDict(arbitrary_types_allowed=True)
