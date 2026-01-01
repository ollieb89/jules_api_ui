"""Tests for jules.services module, focusing on retry logic and error handling."""

from unittest.mock import Mock, patch

import httpx
import pytest

from jules.services import (
    BACKOFF_FACTOR,
    MAX_RETRY_DELAY,
    RETRY_STATUS_CODES,
    JulesApiClient,
    _get_client,
    cleanup_clients,
)


@pytest.fixture
def mock_settings():
    """Mock Django settings to provide API key."""
    with patch("jules.services.settings") as mock_settings:
        mock_settings.JULES_API_KEY = "test-api-key"
        yield mock_settings


@pytest.fixture
def mock_jules_settings():
    """Mock JulesSettings model to avoid DB access."""
    with patch("jules.models.JulesSettings") as mock:
        mock.get_settings.side_effect = Exception("No settings in DB")
        yield mock


@pytest.fixture
def client(mock_settings, mock_jules_settings):
    """Create a JulesApiClient instance with mocked settings."""
    return JulesApiClient()


class TestThreadLocalClient:
    """Test thread-local client management."""

    def test_get_client_creates_new_client(self):
        """Test that _get_client creates a new client if none exists."""
        # Clean up any existing client
        cleanup_clients()

        client = _get_client()
        assert isinstance(client, httpx.Client)
        assert client.timeout.read == 30.0

    def test_get_client_reuses_existing_client(self):
        """Test that _get_client reuses the same client in the same thread."""
        cleanup_clients()

        client1 = _get_client()
        client2 = _get_client()
        assert client1 is client2

    def test_cleanup_clients_closes_client(self):
        """Test that cleanup_clients properly closes the client."""
        cleanup_clients()
        client = _get_client()

        with patch.object(client, "close") as mock_close:
            cleanup_clients()
            mock_close.assert_called_once()


class TestBackoffDelay:
    """Test backoff delay calculation."""

    def test_exponential_backoff_without_retry_after(self, client):
        """Test exponential backoff when no Retry-After header."""
        delay0 = client._get_backoff_delay(0)
        delay1 = client._get_backoff_delay(1)
        delay2 = client._get_backoff_delay(2)

        assert delay0 == BACKOFF_FACTOR * (2**0)
        assert delay1 == BACKOFF_FACTOR * (2**1)
        assert delay2 == BACKOFF_FACTOR * (2**2)

    def test_retry_after_header_takes_precedence(self, client):
        """Test that Retry-After header value is used when present."""
        mock_response = Mock()
        mock_response.headers = {"Retry-After": "5.5"}

        delay = client._get_backoff_delay(0, mock_response)
        assert delay == 5.5

    def test_invalid_retry_after_falls_back_to_exponential(self, client):
        """Test fallback to exponential backoff for invalid Retry-After."""
        mock_response = Mock()
        mock_response.headers = {"Retry-After": "invalid"}

        delay = client._get_backoff_delay(1, mock_response)
        assert delay == BACKOFF_FACTOR * (2**1)

    def test_delay_is_capped_at_max(self, client):
        """Test that delay is capped at MAX_RETRY_DELAY."""
        # For attempt 10, exponential backoff would be huge
        delay = client._get_backoff_delay(10)
        assert delay == MAX_RETRY_DELAY

        # Test with large Retry-After header
        mock_response = Mock()
        mock_response.headers = {"Retry-After": "3600"}
        delay = client._get_backoff_delay(0, mock_response)
        assert delay == MAX_RETRY_DELAY


class TestRequestRetryLogic:
    """Test the _request method retry logic."""

    def test_successful_request_no_retry(self, client):
        """Test that successful requests don't retry."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()

        with patch.object(client.client, "request", return_value=mock_response):
            response = client._request("GET", "http://example.com")

            assert response == mock_response
            mock_response.raise_for_status.assert_called_once()
            client.client.request.assert_called_once()

    def test_timeout_retries_and_succeeds(self, client):
        """Test that TimeoutException triggers retry and succeeds."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()

        call_count = 0

        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise httpx.TimeoutException("timeout")
            return mock_response

        with patch.object(client.client, "request", side_effect=side_effect):
            with patch("jules.services.time.sleep") as mock_sleep:
                response = client._request("GET", "http://example.com")

                assert response == mock_response
                assert call_count == 2
                mock_sleep.assert_called_once()

    def test_timeout_exhausts_retries(self, client):
        """Test that TimeoutException raises after max retries."""

        def side_effect(*args, **kwargs):
            raise httpx.TimeoutException("timeout")

        with patch.object(client.client, "request", side_effect=side_effect):
            with patch("jules.services.time.sleep"):
                with pytest.raises(httpx.TimeoutException):
                    client._request("GET", "http://example.com")

    def test_request_error_retries_and_succeeds(self, client):
        """Test that RequestError triggers retry and succeeds."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()

        call_count = 0

        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise httpx.RequestError("connection error")
            return mock_response

        with patch.object(client.client, "request", side_effect=side_effect):
            with patch("jules.services.time.sleep") as mock_sleep:
                response = client._request("GET", "http://example.com")

                assert response == mock_response
                assert call_count == 2
                mock_sleep.assert_called_once()

    def test_retryable_status_code_retries(self, client):
        """Test that retryable status codes trigger retry."""
        mock_response_500 = Mock()
        mock_response_500.status_code = 500
        mock_response_500.headers = {}
        mock_response_500.close = Mock()

        mock_response_200 = Mock()
        mock_response_200.status_code = 200
        mock_response_200.raise_for_status = Mock()

        call_count = 0

        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return mock_response_500
            return mock_response_200

        with patch.object(client.client, "request", side_effect=side_effect):
            with patch("jules.services.time.sleep") as mock_sleep:
                response = client._request("GET", "http://example.com")

                assert response == mock_response_200
                assert call_count == 2
                mock_response_500.close.assert_called_once()
                mock_sleep.assert_called_once()

    def test_all_retryable_status_codes_are_retried(self, client):
        """Test that all codes in RETRY_STATUS_CODES trigger retry."""
        for status_code in RETRY_STATUS_CODES:
            mock_response_error = Mock()
            mock_response_error.status_code = status_code
            mock_response_error.headers = {}
            mock_response_error.close = Mock()

            mock_response_ok = Mock()
            mock_response_ok.status_code = 200
            mock_response_ok.raise_for_status = Mock()

            with patch.object(
                client.client,
                "request",
                side_effect=[mock_response_error, mock_response_ok],
            ):
                with patch("jules.services.time.sleep"):
                    response = client._request("GET", "http://example.com")
                    assert response == mock_response_ok
                    mock_response_error.close.assert_called_once()

    def test_non_retryable_error_raises_immediately(self, client):
        """Test that non-retryable errors raise immediately."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.raise_for_status = Mock(
            side_effect=httpx.HTTPStatusError(
                "Not found", request=Mock(), response=mock_response
            )
        )

        with patch.object(client.client, "request", return_value=mock_response):
            with pytest.raises(httpx.HTTPStatusError):
                client._request("GET", "http://example.com")

            # Should not retry
            client.client.request.assert_called_once()

    def test_retry_after_header_is_honored(self, client):
        """Test that Retry-After header value is used for sleep."""
        mock_response_429 = Mock()
        mock_response_429.status_code = 429
        mock_response_429.headers = {"Retry-After": "2.5"}
        mock_response_429.close = Mock()

        mock_response_200 = Mock()
        mock_response_200.status_code = 200
        mock_response_200.raise_for_status = Mock()

        with patch.object(
            client.client, "request", side_effect=[mock_response_429, mock_response_200]
        ):
            with patch("jules.services.time.sleep") as mock_sleep:
                client._request("GET", "http://example.com")

                # Should sleep for the Retry-After value (capped at MAX_RETRY_DELAY)
                assert mock_sleep.call_args[0][0] == 2.5

    def test_retry_logging(self, client):
        """Test that retries are logged with appropriate messages."""
        mock_response_503 = Mock()
        mock_response_503.status_code = 503
        mock_response_503.headers = {}
        mock_response_503.close = Mock()

        mock_response_200 = Mock()
        mock_response_200.status_code = 200
        mock_response_200.raise_for_status = Mock()

        with patch.object(
            client.client, "request", side_effect=[mock_response_503, mock_response_200]
        ):
            with patch("jules.services.time.sleep"):
                with patch("jules.services.logger") as mock_logger:
                    client._request("GET", "http://example.com/test")

                    # Should log warning about retry
                    mock_logger.warning.assert_called()
                    log_call = mock_logger.warning.call_args[0]
                    assert "503" in str(log_call)
                    assert "http://example.com/test" in str(log_call)


class TestJulesApiClientMethods:
    """Test that API client methods use _request correctly."""

    def test_list_sources_uses_request(self, client):
        """Test that list_sources uses _request."""
        mock_response = Mock()
        mock_response.json = Mock(return_value={"sources": []})

        with patch.object(client, "_request", return_value=mock_response):
            result = client.list_sources()

            client._request.assert_called_once()
            assert result == {"sources": []}

    def test_create_session_uses_request(self, client):
        """Test that create_session uses _request."""
        mock_response = Mock()
        mock_response.json = Mock(return_value={"session": "123"})

        with patch.object(client, "_request", return_value=mock_response):
            result = client.create_session("test prompt", "source")

            client._request.assert_called_once()
            call_args = client._request.call_args
            assert call_args[0][0] == "POST"
            assert "sessions" in call_args[0][1]
            assert result == {"session": "123"}

    def test_delete_session_uses_request(self, client):
        """Test that delete_session uses _request without extra raise_for_status."""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()

        with patch.object(client, "_request", return_value=mock_response):
            client.delete_session("session123")

            client._request.assert_called_once()
            # _request already calls raise_for_status, so it shouldn't be called again
            mock_response.raise_for_status.assert_not_called()
