import logging
from rest_framework.response import Response
from rest_framework import status

def handle_view_exception(exc: Exception, logger_name: str) -> Response:
    """
    Centralized exception handler for views.
    Logs the exception and returns a generic 500 response to prevent information leakage.

    Args:
        exc: The exception that was raised.
        logger_name: The name of the logger to use (usually __name__ of the calling module).

    Returns:
        Response: A DRF Response object with a generic error message and 500 status.
    """
    logger = logging.getLogger(logger_name)
    logger.error(f"Internal Server Error: {exc}", exc_info=True)

    return Response(
        {"error": "An internal server error occurred."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
