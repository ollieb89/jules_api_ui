"""Tests for jules.services module, focusing on retry logic and error handling."""

from unittest.mock import Mock, patch

import httpx
import pytest

from jules.services import ApiRequestError, JulesApiClient, SharedHttpClient, RetryPolicy


@pytest.fixture
def mock_settings():
    """Mock Django settings to provide API configuration."""
    with patch("jules.services.settings") as mock_settings:
        mock_settings.JULES_API_KEY = "test-api-key"
        mock_settings.JULES_API_BASE_URL = "https://example.com"
        mock_settings.JULES_API_VERSION = "v1"
        yield mock_settings


@pytest.fixture
def mock_jules_settings():
    """Mock JulesSettings model to avoid DB access."""
    with patch("jules.models.JulesSettings") as mock:
        mock.get_settings.side_effect = Exception("No settings in DB")
        yield mock


@pytest.fixture
def shared_client(monkeypatch):
    """Create a SharedHttpClient with deterministic settings."""
    monkeypatch.setattr("jules.services.MAX_RETRIES", 1)
    monkeypatch.setattr("jules.services.BACKOFF_SECONDS", 0.1)
    monkeypatch.setattr("jules.services.RETRY_STATUS_CODES", {429, 503})
    monkeypatch.setattr(
        "jules.services.TIMEOUT_POLICIES",
        {"default": httpx.Timeout(5.0, connect=1.0), "long": httpx.Timeout(10.0)},
    )
    # We need to ensure that the SharedHttpClient uses these mocked values if they are read at init or call time.
    # However, SharedHttpClient reads them via _resolve_retry_policy which uses the module level constants or settings.
    # The monkeypatch of module level constants above should work if they are read after this point.

    return SharedHttpClient({"X-Test": "true"})

@pytest.fixture
def client(mock_settings, mock_jules_settings):
    """Create a JulesApiClient instance with mocked settings."""
    return JulesApiClient()

@pytest.fixture
def retry_policy():
    return RetryPolicy(max_retries=1, backoff_seconds=0.1, status_codes={429, 503})


class TestSharedHttpClientBackoff:
    """Test backoff delay calculation and retry handling."""

    def test_retry_after_header_takes_precedence(self, shared_client, retry_policy):
        response = httpx.Response(
            429,
            request=httpx.Request("GET", "http://example.com"),
            headers={"Retry-After": "2.5"},
        )
        assert shared_client._calculate_backoff(0, response, retry_policy) == 2.5

    def test_invalid_retry_after_falls_back_to_exponential(self, shared_client, retry_policy):
        response = httpx.Response(
            503,
            request=httpx.Request("GET", "http://example.com"),
            headers={"Retry-After": "invalid"},
        )
        # 0.1 * (2^1) = 0.2
        assert shared_client._calculate_backoff(1, response, retry_policy) == 0.2


class TestSharedHttpClientRequest:
    """Test the request method retry logic and error mapping."""

    def test_successful_request_no_retry(self, shared_client):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"ok"
        mock_response.raise_for_status = Mock()

        with patch.object(shared_client._client, "request", return_value=mock_response):
            response = shared_client.request("GET", "http://example.com")

        assert response == mock_response
        mock_response.raise_for_status.assert_called_once()

    def test_retryable_status_retries_then_succeeds(self, shared_client):
        retry_response = Mock()
        retry_response.status_code = 503
        retry_response.headers = {}
        retry_response.content = b""

        success_response = Mock()
        success_response.status_code = 200
        success_response.content = b"ok"
        success_response.raise_for_status = Mock()

        # Mock _resolve_retry_policy to return our desired policy
        with patch("jules.services._resolve_retry_policy") as mock_resolve:
             mock_resolve.return_value = RetryPolicy(max_retries=1, backoff_seconds=0.1, status_codes={503})

             with patch.object(
                shared_client._client,
                "request",
                side_effect=[retry_response, success_response],
            ):
                with patch("jules.services.time.sleep") as mock_sleep:
                    response = shared_client.request("GET", "http://example.com")

        assert response == success_response
        mock_sleep.assert_called_once_with(0.1)

    def test_retry_after_header_is_honored(self, shared_client):
        retry_response = Mock()
        retry_response.status_code = 429
        retry_response.headers = {"Retry-After": "1.5"}
        retry_response.content = b""

        success_response = Mock()
        success_response.status_code = 200
        success_response.content = b"ok"
        success_response.raise_for_status = Mock()

        with patch("jules.services._resolve_retry_policy") as mock_resolve:
             mock_resolve.return_value = RetryPolicy(max_retries=1, backoff_seconds=0.1, status_codes={429})

             with patch.object(
                shared_client._client,
                "request",
                side_effect=[retry_response, success_response],
            ):
                with patch("jules.services.time.sleep") as mock_sleep:
                    shared_client.request("GET", "http://example.com")

        mock_sleep.assert_called_once_with(1.5)

    def test_http_status_error_maps_to_api_request_error(self, shared_client):
        request = httpx.Request("GET", "http://example.com")
        response = httpx.Response(
            400, request=request, json={"error": {"message": "Bad request", "status": "BAD"}}
        )

        with patch.object(shared_client._client, "request", return_value=response):
            with pytest.raises(ApiRequestError) as excinfo:
                shared_client.request("GET", "http://example.com")

        err = excinfo.value
        assert err.status_code == 400
        assert err.details["upstream_status"] == 400
        assert err.details["error_code"] == "BAD"
        assert "Bad request" in err.user_message

    def test_request_error_maps_to_service_unavailable(self, shared_client, monkeypatch):
        # Instead of monkeypatching the class attribute which doesn't exist, we mock _resolve_retry_policy
        with patch("jules.services._resolve_retry_policy") as mock_resolve:
            mock_resolve.return_value = RetryPolicy(max_retries=0, backoff_seconds=0.1, status_codes=set())

            request = httpx.Request("GET", "http://example.com")

            with patch.object(
                shared_client._client,
                "request",
                side_effect=httpx.RequestError("boom", request=request),
            ):
                with pytest.raises(ApiRequestError) as excinfo:
                    shared_client.request("GET", "http://example.com")

        err = excinfo.value
        assert err.status_code == 503
        assert err.details["retryable"] is True

    def test_timeout_policy_is_used(self, shared_client):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"ok"
        mock_response.raise_for_status = Mock()

        with patch.object(shared_client._client, "request", return_value=mock_response) as req:
            shared_client.request("GET", "http://example.com", timeout_policy="long")

        _, kwargs = req.call_args
        assert isinstance(kwargs["timeout"], httpx.Timeout)
        assert kwargs["timeout"].read == 10.0


class TestJulesApiClientMethods:
    """Test that API client methods use SharedHttpClient correctly."""

    def test_list_sources_uses_shared_client(self, client):
        mock_response = Mock()
        mock_response.json = Mock(return_value={"sources": []})

        # In the original file 'client' fixture returns JulesApiClient.
        # JulesApiClient sets self._client = SharedHttpClient(...)
        # However, due to mocking or changes, it seems self._client might be something else or the test environment is confusing it.
        # Let's verify what `client` is. It should be JulesApiClient.

        with patch.object(client._client, "request", return_value=mock_response) as mock_req:
            result = client.list_sources()

        mock_req.assert_called_once()
        assert result == {"sources": []}

    def test_create_session_uses_shared_client(self, client):
        mock_response = Mock()
        mock_response.json = Mock(return_value={"session": "123"})

        with patch.object(client._client, "request", return_value=mock_response) as mock_req:
            result = client.create_session("test prompt", "source")

        mock_req.assert_called_once()
        call_args = mock_req.call_args
        assert call_args.kwargs["timeout_policy"] == "long"
        assert result == {"session": "123"}

    def test_delete_session_uses_shared_client(self, client):
        mock_response = Mock()
        mock_response.raise_for_status = Mock()

        with patch.object(client._client, "request", return_value=mock_response) as mock_req:
            client.delete_session("session123")

        mock_req.assert_called_once()
