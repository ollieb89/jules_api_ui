import logging
import time
from typing import Any, Mapping

import httpx
from django.conf import settings

from .utils import get_correlation_id, log_jules_api_call

logger = logging.getLogger(__name__)


class ApiRequestError(Exception):
    """Represents an error response from the Jules API or network layer."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
        user_message: str | None = None,
        retry_after: float | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}
        self.user_message = user_message or message
        self.retry_after = retry_after


class SharedHttpClient:
    """Shared HTTP client with retry, backoff, and timeout policies."""

    RETRY_STATUS_CODES = set(
        getattr(settings, "JULES_API_RETRY_STATUS_CODES", {429, 502, 503, 504})
    )
    MAX_RETRIES = int(getattr(settings, "JULES_API_MAX_RETRIES", 2))
    BACKOFF_SECONDS = float(getattr(settings, "JULES_API_BACKOFF_SECONDS", 0.5))
    TIMEOUT_POLICIES: Mapping[str, Any] = getattr(
        settings,
        "JULES_API_TIMEOUT_POLICIES",
        {
            "default": httpx.Timeout(30.0, connect=5.0),
            "long": httpx.Timeout(60.0, connect=10.0),
        },
    )

    def __init__(self, headers: dict[str, str]) -> None:
        self._client = httpx.Client(headers=headers)

    def request(
        self,
        method: str,
        url: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        timeout_policy: str = "default",
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        timeout = self._resolve_timeout(timeout_policy)

        for attempt in range(self.MAX_RETRIES + 1):
            start_time = time.monotonic()
            try:
                response = self._client.request(
                    method,
                    url,
                    json=json,
                    params=params,
                    data=data,
                    headers=headers,
                    timeout=timeout,
                )

                if response.status_code in self.RETRY_STATUS_CODES and attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, response.status_code, response)
                    continue

                response.raise_for_status()
                log_jules_api_call(
                    method=method,
                    url=url,
                    status_code=response.status_code,
                    duration_s=time.monotonic() - start_time,
                    response_bytes=len(response.content),
                )
                return response
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if status_code in self.RETRY_STATUS_CODES and attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, status_code, exc.response)
                    continue
                log_jules_api_call(
                    method=method,
                    url=url,
                    status_code=status_code,
                    duration_s=time.monotonic() - start_time,
                    response_bytes=len(exc.response.content),
                    error=exc.__class__.__name__,
                )
                raise self._map_http_status_error(exc, attempt) from exc
            except httpx.RequestError as exc:
                if attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, None, None)
                    continue
                log_jules_api_call(
                    method=method,
                    url=url,
                    duration_s=time.monotonic() - start_time,
                    error=exc.__class__.__name__,
                )
                raise ApiRequestError(
                    "Upstream request failed.",
                    status_code=503,
                    details={
                        "error_type": exc.__class__.__name__,
                        "method": method,
                        "url": str(exc.request.url) if exc.request else url,
                        "retryable": True,
                    },
                    user_message="Upstream service is unavailable. Please try again shortly.",
                    retry_after=self._calculate_backoff(attempt),
                ) from exc

        raise ApiRequestError(
            "Upstream request failed.",
            status_code=503,
            user_message="Upstream service is unavailable. Please try again shortly.",
            retry_after=self._calculate_backoff(self.MAX_RETRIES),
        )

    def _sleep_backoff(
        self,
        attempt: int,
        url: str,
        status_code: int | None,
        response: httpx.Response | None,
    ) -> None:
        delay = self._calculate_backoff(attempt, response)
        log_extra: dict[str, Any] = {
            "attempt": attempt + 1,
            "delay_seconds": delay,
            "status_code": status_code,
            "url": url,
        }
        correlation_id = get_correlation_id()
        if correlation_id:
            log_extra["correlation_id"] = correlation_id
        logger.warning(
            "Retrying Jules API request",
            extra=log_extra,
        )
        time.sleep(delay)

    def _calculate_backoff(self, attempt: int, response: httpx.Response | None = None) -> float:
        retry_after = self._parse_retry_after(response) if response else None
        if retry_after is not None:
            return retry_after
        return self.BACKOFF_SECONDS * (2**attempt)

    def _parse_retry_after(self, response: httpx.Response | None) -> float | None:
        if response is None:
            return None
        retry_after = response.headers.get("Retry-After")
        if not retry_after:
            return None
        try:
            return float(retry_after)
        except ValueError:
            return None

    def _resolve_timeout(self, timeout_policy: str) -> httpx.Timeout:
        default_timeout = self._coerce_timeout(self.TIMEOUT_POLICIES.get("default"))
        policy_value = self.TIMEOUT_POLICIES.get(timeout_policy, default_timeout)
        return self._coerce_timeout(policy_value) or default_timeout

    def _coerce_timeout(self, value: Any) -> httpx.Timeout:
        if isinstance(value, httpx.Timeout):
            return value
        if isinstance(value, (int, float)):
            return httpx.Timeout(float(value))
        if isinstance(value, Mapping):
            return httpx.Timeout(**value)
        return httpx.Timeout(30.0)

    def _map_http_status_error(
        self,
        exc: httpx.HTTPStatusError,
        attempt: int,
    ) -> ApiRequestError:
        response = exc.response
        message = response.text.strip() or response.reason_phrase
        retry_after = self._parse_retry_after(response)
        details: dict[str, Any] = {
            "upstream_status": response.status_code,
            "error_type": exc.__class__.__name__,
        }
        upstream_request_id = response.headers.get("X-Request-ID") or response.headers.get(
            "X-Correlation-ID"
        )
        if upstream_request_id:
            details["upstream_request_id"] = upstream_request_id

        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict):
            if isinstance(payload.get("error"), dict):
                error_payload = payload["error"]
                message = error_payload.get("message", message)
                details["error_code"] = error_payload.get("status") or error_payload.get("code")
                if "details" in error_payload:
                    details["error_details"] = error_payload["details"]
            else:
                message = payload.get("message", message)
                details["error_payload"] = payload
        elif payload is not None:
            details["error_payload"] = payload

        if response.status_code in self.RETRY_STATUS_CODES:
            details["retryable"] = True
            details["retry_after_seconds"] = retry_after or self._calculate_backoff(attempt)
            user_message = "Upstream service is busy. Please retry shortly."
        else:
            user_message = message

        return ApiRequestError(
            message,
            status_code=response.status_code,
            details=details,
            user_message=user_message,
            retry_after=details.get("retry_after_seconds"),
        )

    def close(self) -> None:
        self._client.close()


class JulesApiClient:
    """Client for interacting with the Google Jules API."""

    def __init__(self):
        # Try to get API key from database settings first, then environment
        try:
            from .models import JulesSettings

            settings_obj = JulesSettings.get_settings()
            self.api_key = settings_obj.get_api_key()
        except Exception:
            self.api_key = None

        if not self.api_key:
            self.api_key = settings.JULES_API_KEY

        if not self.api_key:
            raise ValueError("JULES_API_KEY must be set in settings or environment")
        self.base_url = settings.JULES_API_BASE_URL
        self.api_version = settings.JULES_API_VERSION
        self.headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }
        self._client = SharedHttpClient(self.headers)

    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        return f"{self.base_url}/{self.api_version}/{endpoint}"

    def list_sources(self) -> dict[str, Any]:
        """List all connected GitHub repositories."""
        url = self._get_url("sources")
        response = self._client.request("GET", url, timeout_policy="default")
        return response.json()

    def create_session(self, prompt: str, source: str) -> dict[str, Any]:
        """Create a new coding session."""
        url = self._get_url("sessions")
        payload = {
            "prompt": prompt,
            "source": source,
        }
        response = self._client.request("POST", url, json=payload, timeout_policy="long")
        return response.json()

    def list_sessions(
        self, page_size: int = 100, page_token: str | None = None
    ) -> dict[str, Any]:
        """List all sessions with pagination."""
        url = self._get_url("sessions")
        params: dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        response = self._client.request("GET", url, params=params, timeout_policy="default")
        return response.json()

    def _normalize_session_id(self, session_id: str) -> str:
        """Normalize session ID to full format (sessions/{id})."""
        if session_id.startswith("sessions/"):
            return session_id
        return f"sessions/{session_id}"

    def get_session(self, session_id: str) -> dict[str, Any]:
        """Get a specific session by ID."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(normalized_id)
        response = self._client.request("GET", url, timeout_policy="default")
        return response.json()

    def delete_session(self, session_id: str) -> None:
        """Delete a session."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(normalized_id)
        self._client.request("DELETE", url, timeout_policy="default")

    def approve_plan(self, session_id: str) -> dict[str, Any]:
        """Approve a generated plan."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:approvePlan")
        response = self._client.request("POST", url, timeout_policy="default")
        return response.json()

    def send_message(self, session_id: str, message: str) -> dict[str, Any]:
        """Send a message to the agent."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:sendMessage")
        payload = {"message": message}
        response = self._client.request("POST", url, json=payload, timeout_policy="long")
        return response.json()

    def list_activities(
        self, session_id: str, page_size: int = 100, page_token: str | None = None
    ) -> dict[str, Any]:
        """List activities for a session with pagination."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}/activities")
        params: dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        response = self._client.request("GET", url, params=params, timeout_policy="default")
        return response.json()

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()
