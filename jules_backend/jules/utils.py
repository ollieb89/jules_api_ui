import logging
from typing import Any, Dict, Optional
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def handle_view_exception(
    e: Exception,
    message: str = "An internal error occurred.",
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    additional_data: Optional[Dict[str, Any]] = None
) -> Response:
    """
    Handles exceptions in views by logging the full error and returning a generic response.
    Prevents sensitive information leakage in error responses.

    Args:
        e: The exception that occurred
        message: The generic error message to return to the client
        status_code: The HTTP status code to return (default: 500)
        additional_data: Optional dictionary of data to include in the response

    Returns:
        Response: A DRF Response with the specified status and error message
    """
    # Log the full stack trace securely on the server
    logger.exception(f"Internal Server Error: {str(e)}")

    # Build response data
    data = {"error": message}
    if additional_data:
        data.update(additional_data)

    # Return the response
    return Response(data, status=status_code)
