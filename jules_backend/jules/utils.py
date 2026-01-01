import logging
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def _get_correlation_id(request: Request | None) -> str | None:
    if not request:
        return None
    return (
        request.headers.get("X-Request-ID")
        or request.headers.get("X-Correlation-ID")
        or request.META.get("HTTP_X_REQUEST_ID")
        or request.META.get("HTTP_X_CORRELATION_ID")
    )


def handle_api_exception(e: Exception, request: Request | None = None) -> Response:
    """
    Log the exception and return a secure error response.
    In DEBUG mode, return the exception message.
    In production, return a generic error message.
    """
    correlation_id = _get_correlation_id(request)
    status_code = getattr(e, "status_code", None) or status.HTTP_500_INTERNAL_SERVER_ERROR

    log_extra: dict[str, Any] = {"status_code": status_code}
    if correlation_id:
        log_extra["correlation_id"] = correlation_id

    logger.error("API Error: %s", str(e), exc_info=True, extra=log_extra)

    retry_after = getattr(e, "retry_after", None)
    user_message = getattr(e, "user_message", None)

    if isinstance(e, Throttled):
        retry_after = e.wait
        user_message = str(e) or "Request rate limit exceeded. Please retry shortly."

    if settings.DEBUG:
        error_msg = str(e)
    else:
        if user_message:
            error_msg = user_message
        elif status_code and 400 <= status_code < 500:
            error_msg = str(e)
        else:
            error_msg = "An internal server error occurred."

    payload: dict[str, Any] = {"error": error_msg}
    if correlation_id:
        payload["correlation_id"] = correlation_id
    if retry_after is not None:
        payload["retry_after_seconds"] = retry_after

    details = getattr(e, "details", None)
    if details and settings.DEBUG:
        payload["details"] = details

    return Response(payload, status=status_code)


def drf_exception_handler(exc: Exception, context: dict[str, Any] | None) -> Response | None:
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    if isinstance(exc, Throttled):
        response.data = {
            "error": str(exc) or "Request rate limit exceeded. Please retry shortly.",
            "retry_after_seconds": exc.wait,
        }
    return response
