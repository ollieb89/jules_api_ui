import json
import logging
from contextvars import ContextVar, Token
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

logger = logging.getLogger(__name__)

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def set_correlation_id(value: str | None) -> Token[str | None]:
    return _correlation_id.set(value)


def reset_correlation_id(token: Token[str | None]) -> None:
    _correlation_id.reset(token)


def get_correlation_id(request: Request | None = None) -> str | None:
    if not request:
        return _correlation_id.get()
    return (
        request.headers.get("X-Request-ID")
        or request.headers.get("X-Correlation-ID")
        or request.META.get("HTTP_X_REQUEST_ID")
        or request.META.get("HTTP_X_CORRELATION_ID")
        or _correlation_id.get()
    )


def log_jules_api_call(
    *,
    method: str,
    url: str,
    status_code: int | None = None,
    duration_s: float | None = None,
    response_bytes: int | None = None,
    error: str | None = None,
) -> None:
    log_extra: dict[str, Any] = {"method": method, "url": url}
    correlation_id = get_correlation_id()
    if correlation_id:
        log_extra["correlation_id"] = correlation_id
    if status_code is not None:
        log_extra["status_code"] = status_code
    if duration_s is not None:
        log_extra["duration_ms"] = round(duration_s * 1000, 2)
    if response_bytes is not None:
        log_extra["response_bytes"] = response_bytes
    if error is not None:
        log_extra["error"] = error
    logger.info("Jules API request metadata", extra=log_extra)


def handle_api_exception(e: Exception, request: Request | None = None) -> Response:
    """
    Log the exception and return a secure error response.
    In DEBUG mode, return the exception message.
    In production, return a generic error message.
    """
    correlation_id = get_correlation_id(request)
    status_code = getattr(e, "status_code", None) or status.HTTP_500_INTERNAL_SERVER_ERROR

    log_extra: dict[str, Any] = {"status_code": status_code}
    if correlation_id:
        log_extra["correlation_id"] = correlation_id

    logger.error("API Error: %s", str(e), exc_info=True, extra=log_extra)

    if settings.DEBUG:
        error_msg = str(e)
    else:
        if status_code and 400 <= status_code < 500:
            error_msg = str(e)
        else:
            error_msg = "An internal server error occurred."

    payload: dict[str, Any] = {"error": error_msg}
    if correlation_id:
        payload["correlation_id"] = correlation_id

    details = getattr(e, "details", None)
    if details and settings.DEBUG:
        payload["details"] = details

    return Response(payload, status=status_code)
