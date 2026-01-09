"""Tests for jules.utils module, focusing on error handling and mapping."""

import json
from unittest.mock import Mock, PropertyMock, patch

import httpx
from rest_framework import status

from rest_framework.exceptions import Throttled
from jules.utils import _extract_upstream_error, handle_api_exception, drf_exception_handler


class TestExtractUpstreamError:
    """Test _extract_upstream_error function."""

    def test_extracts_json_dict(self):
        """Test extraction of JSON dictionary from response."""
        mock_response = Mock()
        mock_response.json = Mock(return_value={"error": "test error", "code": 400})

        result = _extract_upstream_error(mock_response)
        assert result == {"error": "test error", "code": 400}

    def test_falls_back_to_text_on_json_decode_error(self):
        """Test fallback to text when JSON decoding fails."""
        mock_response = Mock()
        mock_response.json = Mock(side_effect=json.JSONDecodeError("error", "", 0))
        mock_response.text = "Plain text error"

        result = _extract_upstream_error(mock_response)
        assert result == {"detail": "Plain text error"}

    def test_falls_back_to_text_on_response_not_read(self):
        """Test fallback to text when response not fully read."""
        mock_response = Mock()
        mock_response.json = Mock(side_effect=httpx.ResponseNotRead())
        mock_response.text = "Error text"

        result = _extract_upstream_error(mock_response)
        assert result == {"detail": "Error text"}

    def test_handles_text_as_string(self):
        """Test handling of plain text response."""
        mock_response = Mock()
        mock_response.json = Mock(side_effect=ValueError("Invalid JSON"))
        mock_response.text = "Server error occurred"

        result = _extract_upstream_error(mock_response)
        assert result == {"detail": "Server error occurred"}

    def test_handles_empty_response(self):
        """Test handling of empty response."""
        mock_response = Mock()
        mock_response.json = Mock(side_effect=ValueError("No content"))
        # When text property raises ResponseNotRead, payload should be None
        type(mock_response).text = PropertyMock(side_effect=httpx.ResponseNotRead())

        result = _extract_upstream_error(mock_response)
        assert result == {"detail": "Upstream service error."}

    def test_handles_none_text(self):
        """Test handling when text is None or empty."""
        mock_response = Mock()
        mock_response.json = Mock(side_effect=ValueError("Invalid"))
        mock_response.text = ""

        result = _extract_upstream_error(mock_response)
        assert result == {"detail": "Upstream service error."}


class TestHandleApiException:
    """Test handle_api_exception function."""

    def test_http_status_error_preserves_status_code(self):
        """Test HTTPStatusError preserves upstream status code."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.json = Mock(return_value={"message": "Not found"})

        error = httpx.HTTPStatusError(
            "Not found", request=Mock(), response=mock_response
        )

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        assert response.status_code == 404
        assert "error" in response.data
        assert "message" in response.data["error"]
        assert response.data["error"]["message"] == "Upstream service error"
        assert "detail" in response.data["error"]
        assert response.data["error"]["detail"] == {"message": "Not found"}

    def test_http_status_error_with_text_response(self):
        """Test HTTPStatusError with plain text response."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json = Mock(side_effect=json.JSONDecodeError("error", "", 0))
        mock_response.text = "Internal server error"

        error = httpx.HTTPStatusError(
            "Server error", request=Mock(), response=mock_response
        )

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        assert response.status_code == 500
        assert response.data["error"]["detail"] == {"detail": "Internal server error"}

    def test_timeout_exception_returns_504(self):
        """Test TimeoutException returns 504 Gateway Timeout."""
        error = httpx.TimeoutException("Request timed out")

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        assert response.status_code == status.HTTP_504_GATEWAY_TIMEOUT
        assert "error" in response.data
        assert response.data["error"]["message"] == "Upstream request timed out"
        assert "detail" in response.data["error"]

    def test_request_error_returns_503(self):
        """Test RequestError returns 503 Service Unavailable."""
        error = httpx.RequestError("Connection failed")

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "error" in response.data
        assert response.data["error"]["message"] == "Upstream request failed"
        assert "Connection failed" in str(response.data["error"]["detail"])

    def test_generic_exception_in_debug_mode(self):
        """Test generic exception handling in DEBUG mode."""
        error = ValueError("Some internal error")

        with patch("jules.utils.settings") as mock_settings:
            mock_settings.DEBUG = True
            with patch("jules.utils.logger"):
                response = handle_api_exception(error)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "error" in response.data
        assert response.data["error"]["message"] == "Some internal error"

    def test_generic_exception_in_production_mode(self):
        """Test generic exception handling in production mode."""
        error = ValueError("Some internal error")

        with patch("jules.utils.settings") as mock_settings:
            mock_settings.DEBUG = False
            with patch("jules.utils.logger"):
                response = handle_api_exception(error)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "error" in response.data
        assert response.data["error"]["message"] == "An internal server error occurred."

    def test_error_is_logged(self):
        """Test that all exceptions are logged."""
        error = ValueError("Test error")

        with patch("jules.utils.settings") as mock_settings:
            mock_settings.DEBUG = False
            with patch("jules.utils.logger") as mock_logger:
                handle_api_exception(error)

                mock_logger.error.assert_called_once()
                log_call = mock_logger.error.call_args
                assert "API Error" in log_call[0][0]
                assert "Test error" in str(log_call[0])


class TestErrorResponseStructure:
    """Test that error responses have consistent structure."""

    def test_http_status_error_structure(self):
        """Test HTTPStatusError response structure."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json = Mock(return_value={"msg": "bad request"})

        error = httpx.HTTPStatusError(
            "Bad request", request=Mock(), response=mock_response
        )

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        # Check structure
        assert "error" in response.data
        assert isinstance(response.data["error"], dict)
        assert "message" in response.data["error"]
        assert "detail" in response.data["error"]

    def test_timeout_error_structure(self):
        """Test TimeoutException response structure."""
        error = httpx.TimeoutException("timeout")

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        # Check structure matches HTTPStatusError
        assert "error" in response.data
        assert isinstance(response.data["error"], dict)
        assert "message" in response.data["error"]
        assert "detail" in response.data["error"]

    def test_request_error_structure(self):
        """Test RequestError response structure."""
        error = httpx.RequestError("connection error")

        with patch("jules.utils.logger"):
            response = handle_api_exception(error)

        # Check structure matches HTTPStatusError
        assert "error" in response.data
        assert isinstance(response.data["error"], dict)
        assert "message" in response.data["error"]
        assert "detail" in response.data["error"]

    def test_generic_error_structure(self):
        """Test generic exception response structure."""
        error = Exception("generic error")

        with patch("jules.utils.settings") as mock_settings:
            mock_settings.DEBUG = True
            with patch("jules.utils.logger"):
                response = handle_api_exception(error)

        # Check structure
        assert "error" in response.data
        assert isinstance(response.data["error"], dict)
        assert "message" in response.data["error"]

    def test_all_error_responses_are_consistent(self):
        """Test that all error types return consistent top-level structure."""
        errors = [
            httpx.HTTPStatusError(
                "error",
                request=Mock(),
                response=Mock(status_code=500, json=Mock(return_value={})),
            ),
            httpx.TimeoutException("timeout"),
            httpx.RequestError("request error"),
            ValueError("generic error"),
        ]

        for error in errors:
            with patch("jules.utils.settings") as mock_settings:
                mock_settings.DEBUG = False
                with patch("jules.utils.logger"):
                    response = handle_api_exception(error)

                    # All should have error key at top level
                    assert "error" in response.data
                    # All error values should be dicts
                    assert isinstance(response.data["error"], dict)
                    # All should have message
                    assert "message" in response.data["error"]


class TestDrfExceptionHandler:
    """Test custom DRF exception handler."""

    def test_drf_exception_handler_recursion(self):
        """Test that drf_exception_handler does not cause infinite recursion."""
        # This test ensures the fix for the infinite recursion bug works.
        # If the bug exists, this will raise RecursionError.

        # Using a Throttled exception as it triggers the custom logic
        exc = Throttled(wait=60)
        context = {}

        response = drf_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == 429
        assert "retry_after_seconds" in response.data
        assert response.data["retry_after_seconds"] == 60
