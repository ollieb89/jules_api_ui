import json
import logging

import httpx
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def _extract_upstream_error(response: httpx.Response) -> dict[str, object]:
    try:
        payload = response.json()
    except (json.JSONDecodeError, httpx.ResponseNotRead, ValueError):
        try:
            payload = response.text
        except httpx.ResponseNotRead:
            payload = None

    if isinstance(payload, dict):
        return payload

    if payload:
        return {"detail": payload}

    return {"detail": "Upstream service error."}


def handle_api_exception(e: Exception) -> Response:
    """
    Log the exception and return a secure error response.
    In DEBUG mode, return the exception message.
    In production, return a generic error message.
    """
    logger.error("API Error: %s", str(e), exc_info=True)

    if isinstance(e, httpx.HTTPStatusError):
        upstream_response = e.response
        upstream_error = _extract_upstream_error(upstream_response)
        return Response(
            {
                "error": {
                    "message": "Upstream service error",
                    "detail": upstream_error,
                    "status_code": upstream_response.status_code,
                }
            },
            status=upstream_response.status_code,
        )

    if isinstance(e, httpx.TimeoutException):
        return Response(
            {
                "error": {
                    "message": "Upstream request timed out",
                    "detail": str(e),
                }
            },
            status=status.HTTP_504_GATEWAY_TIMEOUT,
        )

    if isinstance(e, httpx.RequestError):
        return Response(
            {
                "error": {
                    "message": "Upstream request failed",
                    "detail": str(e),
                }
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if settings.DEBUG:
        error_msg = str(e)
    else:
        error_msg = "An internal server error occurred."

    return Response(
        {"error": {"message": error_msg}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
