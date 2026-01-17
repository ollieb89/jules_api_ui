import json
import logging
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from contextvars import ContextVar, Token
from typing import Any, Mapping

from django.conf import settings
import httpx
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler as default_drf_exception_handler

from .exceptions.api_error import ApiRequestError

logger = logging.getLogger(__name__)

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)
_SENSITIVE_KEY_MARKERS = ("token", "secret", "password", "auth", "key")
_SENSITIVE_HEADER_KEYS = {
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-csrf-token",
    "x-goog-api-key",
}


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


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    if lowered in _SENSITIVE_HEADER_KEYS:
        return True
    return any(marker in lowered for marker in _SENSITIVE_KEY_MARKERS)


def _sanitize_metadata(metadata: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if not metadata:
        return None
    sanitized: dict[str, Any] = {}
    for key, value in metadata.items():
        if _is_sensitive_key(str(key)):
            sanitized[key] = "[redacted]"
        else:
            sanitized[key] = value
    return sanitized


def sanitize_url(url: str) -> str:
    """Redact sensitive query parameters from URLs before logging."""
    try:
        split_url = urlsplit(url)
        if not split_url.query:
            return url
        query_params = parse_qsl(split_url.query, keep_blank_values=True)
        sanitized_params = []
        for key, value in query_params:
            if _is_sensitive_key(key):
                sanitized_params.append((key, "[redacted]"))
            else:
                sanitized_params.append((key, value))
        sanitized_query = urlencode(sanitized_params, doseq=True)
        return urlunsplit(
            (
                split_url.scheme,
                split_url.netloc,
                split_url.path,
                sanitized_query,
                split_url.fragment,
            )
        )
    except Exception:
        return url


def log_jules_api_call(
    *,
    method: str,
    url: str,
    status_code: int | None = None,
    duration_s: float | None = None,
    response_bytes: int | None = None,
    error: str | None = None,
    request_headers: Mapping[str, Any] | None = None,
    response_headers: Mapping[str, Any] | None = None,
    request_params: Mapping[str, Any] | None = None,
) -> None:
    log_extra: dict[str, Any] = {"method": method, "url": sanitize_url(url)}
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
    if request_headers:
        sanitized_headers = _sanitize_metadata(request_headers)
        if sanitized_headers:
            log_extra["request_headers"] = sanitized_headers
    if response_headers:
        sanitized_headers = _sanitize_metadata(response_headers)
        if sanitized_headers:
            log_extra["response_headers"] = sanitized_headers
    if request_params:
        sanitized_params = _sanitize_metadata(request_params)
        if sanitized_params:
            log_extra["request_params"] = sanitized_params
    logger.info("Jules API request metadata", extra=log_extra)


def _extract_upstream_error(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            return payload
        return {"detail": payload}
    except (ValueError, json.JSONDecodeError, httpx.ResponseNotRead):
        try:
            text = response.text
        except httpx.ResponseNotRead:
            text = None
        if not text:
            return {"detail": "Upstream service error."}
        return {"detail": text}


def _normalize_error_detail(detail: Any) -> tuple[str | None, Any | None]:
    if not isinstance(detail, dict):
        return None, detail
    error_payload = detail.get("error")
    if isinstance(error_payload, dict):
        message = error_payload.get("message") or error_payload.get("detail")
        return message, detail
    message = detail.get("message") or detail.get("detail")
    return message, detail


def handle_api_exception(e: Exception, request: Request | None = None) -> Response:
    """
    Log the exception and return a secure error response.
    In DEBUG mode, return the exception message.
    In production, return a generic error message.
    """
    correlation_id = get_correlation_id(request)
    status_code = getattr(e, "status_code", None)
    details = getattr(e, "details", None)
    error_detail: dict[str, Any] | None = None
    message: str | None = None

    if isinstance(e, httpx.HTTPStatusError):
        status_code = e.response.status_code
        error_detail = _extract_upstream_error(e.response)
        message, error_detail = _normalize_error_detail(error_detail)
        message = message or "Upstream service error"
    elif isinstance(e, httpx.TimeoutException):
        status_code = status.HTTP_504_GATEWAY_TIMEOUT
        error_detail = {"detail": str(e)}
        message = "Upstream request timed out"
    elif isinstance(e, httpx.RequestError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        error_detail = {"detail": str(e)}
        message = "Upstream request failed"
    elif isinstance(e, ApiRequestError):
        if isinstance(details, dict):
            status_code = details.get("upstream_status") or status_code
            error_detail = details
            detail_message, _ = _normalize_error_detail(details)
            if detail_message:
                message = detail_message
        elif details:
            error_detail = details
        message = getattr(e, "user_message", None) or message or str(e)
    elif isinstance(e, Throttled):
        status_code = e.status_code
        error_detail = {"detail": str(e)}
        message = str(e) or "Request rate limit exceeded. Please retry shortly."

    if status_code is None:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    log_extra: dict[str, Any] = {"status_code": status_code}
    if correlation_id:
        log_extra["correlation_id"] = correlation_id
    if isinstance(details, dict) and details.get("upstream_status"):
        log_extra["upstream_status"] = details["upstream_status"]
    if isinstance(details, dict) and details.get("upstream_request_id"):
        log_extra["upstream_request_id"] = details["upstream_request_id"]

    logger.error("API Error: %s", str(e), exc_info=True, extra=log_extra)

    retry_after = getattr(e, "retry_after", None)
    user_message = getattr(e, "user_message", None)

    if settings.DEBUG:
        error_msg = str(e) if message is None else message
    else:
        if message:
            error_msg = message
        elif user_message:
            error_msg = user_message
        elif status_code and 400 <= status_code < 500:
            error_msg = str(e)
        else:
            error_msg = "An internal server error occurred."

    payload: dict[str, Any] = {"error": {"message": error_msg}}
    if correlation_id:
        payload["correlation_id"] = correlation_id
    if retry_after is not None:
        payload["retry_after_seconds"] = retry_after

    if isinstance(e, Throttled):
        retry_after = e.wait
        payload["retry_after_seconds"] = retry_after

    if error_detail is not None:
        payload["error"]["detail"] = error_detail
    elif details and settings.DEBUG:
        payload["error"]["detail"] = details

    return Response(payload, status=status_code)


def drf_exception_handler(exc: Exception, context: dict[str, Any] | None) -> Response | None:
    response = default_drf_exception_handler(exc, context)
    if response is None:
        return None
    if isinstance(exc, Throttled):
        response.data = {
            "error": {
                "message": str(exc) or "Request rate limit exceeded. Please retry shortly.",
                "detail": {"retry_after_seconds": exc.wait},
            },
            "retry_after_seconds": exc.wait,
        }
    return response
