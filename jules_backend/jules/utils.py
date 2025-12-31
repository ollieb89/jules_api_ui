import logging
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger(__name__)

def normalize_session_name(session_id: str) -> str:
    """Normalize session ID to full format (sessions/{id})."""
    if session_id.startswith("sessions/"):
        return session_id
    return f"sessions/{session_id}"

def handle_api_exception(e: Exception) -> Response:
    """
    Log the exception and return a secure error response.
    In DEBUG mode, return the exception message.
    In production, return a generic error message.
    """
    logger.error(f"API Error: {str(e)}", exc_info=True)

    if settings.DEBUG:
        error_msg = str(e)
    else:
        error_msg = "An internal server error occurred."

    return Response(
        {"error": error_msg},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
