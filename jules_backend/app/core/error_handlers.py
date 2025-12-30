from __future__ import annotations

from typing import Iterable

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status

from app.core.exceptions import APIError
from app.schemas.common import ErrorDetail, ErrorResponse
from app.utils.logger import logger


def _format_validation_errors(errors: Iterable[dict]) -> str:
    parts: list[str] = []
    for error in errors:
        location = ".".join(str(item) for item in error.get("loc", []) if item != "body")
        message = error.get("msg", "Invalid value")
        if location:
            parts.append(f"{location}: {message}")
        else:
            parts.append(message)
    return "; ".join(parts) if parts else "Validation failed"


def _error_response(
    *,
    request: Request,
    status_code: int,
    error_type: str,
    title: str,
    detail: str,
) -> JSONResponse:
    payload = ErrorResponse(
        success=False,
        error=ErrorDetail(
            type=error_type,
            title=title,
            detail=detail,
            status=status_code,
            instance=str(request.url.path),
        ),
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


def add_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
        return _error_response(
            request=request,
            status_code=exc.status_code,
            error_type=exc.error_type,
            title=exc.title,
            detail=exc.detail,
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        detail = _format_validation_errors(exc.errors())
        return _error_response(
            request=request,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_type="https://api.jules.dev/errors/validation-error",
            title="Validation Failed",
            detail=detail,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled exception", exc_info=exc)
        return _error_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_type="https://api.jules.dev/errors/internal-server-error",
            title="Internal Server Error",
            detail="An unexpected error occurred.",
        )
