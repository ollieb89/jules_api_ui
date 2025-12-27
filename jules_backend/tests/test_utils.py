import pytest
from unittest.mock import MagicMock, patch
from rest_framework.response import Response
from rest_framework import status

from jules.utils import handle_view_exception

class TestUtils:
    @patch('jules.utils.logger')
    def test_handle_view_exception_structure(self, mock_logger):
        """Test that handle_view_exception returns correct response structure."""
        # Arrange
        exception = ValueError("Secret DB info leakage")

        # Act
        response = handle_view_exception(exception)

        # Assert
        assert isinstance(response, Response)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.data == {"error": "An internal error occurred."}

        # Verify it logged the exception
        mock_logger.exception.assert_called_once()
        args, _ = mock_logger.exception.call_args
        assert "Internal Server Error" in args[0]
        assert "Secret DB info leakage" in args[0]

    @patch('jules.utils.logger')
    def test_handle_view_exception_custom_message(self, mock_logger):
        """Test that handle_view_exception accepts a custom message."""
        # Arrange
        exception = RuntimeError("Something bad")
        custom_msg = "Please try again later."

        # Act
        response = handle_view_exception(exception, message=custom_msg)

        # Assert
        assert response.data == {"error": custom_msg}

    @patch('jules.utils.logger')
    def test_handle_view_exception_custom_status(self, mock_logger):
        """Test that handle_view_exception accepts a custom status code."""
        # Arrange
        exception = RuntimeError("Something bad")

        # Act
        response = handle_view_exception(exception, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Assert
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    @patch('jules.utils.logger')
    def test_handle_view_exception_additional_data(self, mock_logger):
        """Test that handle_view_exception accepts additional data."""
        # Arrange
        exception = RuntimeError("Something bad")
        additional_data = {"retry_after": 60, "code": "ERR_123"}

        # Act
        response = handle_view_exception(exception, additional_data=additional_data)

        # Assert
        assert response.data["error"] == "An internal error occurred."
        assert response.data["retry_after"] == 60
        assert response.data["code"] == "ERR_123"
