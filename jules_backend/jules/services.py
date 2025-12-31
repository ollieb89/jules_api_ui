import logging
import os
import time
from typing import Any

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


class ApiRequestError(Exception):
    """Represents an error response from the Jules API or network layer."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}


class SharedHttpClient:
    """Shared HTTP client with retry, backoff, and timeout policies."""

    RETRY_STATUS_CODES = {502, 503, 504}
    MAX_RETRIES = 2
    BACKOFF_SECONDS = 0.5
    TIMEOUT_POLICIES = {
        "default": httpx.Timeout(30.0, connect=5.0),
        "long": httpx.Timeout(60.0, connect=10.0),
    }

    def __init__(self, headers: dict[str, str]) -> None:
        self._client = httpx.Client(headers=headers)

    def request(
        self,
        method: str,
        url: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        timeout_policy: str = "default",
    ) -> httpx.Response:
        timeout = self.TIMEOUT_POLICIES.get(timeout_policy, self.TIMEOUT_POLICIES["default"])

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                response = self._client.request(
                    method,
                    url,
                    json=json,
                    params=params,
                    timeout=timeout,
                )

                if response.status_code in self.RETRY_STATUS_CODES and attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, response.status_code)
                    continue

                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if status_code in self.RETRY_STATUS_CODES and attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, status_code)
                    continue
                raise self._map_http_status_error(exc) from exc
            except httpx.RequestError as exc:
                if attempt < self.MAX_RETRIES:
                    self._sleep_backoff(attempt, url, None)
                    continue
                raise ApiRequestError(
                    "Upstream request failed.",
                    status_code=503,
                    details={"error_type": exc.__class__.__name__, "url": str(exc.request.url)},
                ) from exc

        raise ApiRequestError("Upstream request failed.", status_code=503)

    def _sleep_backoff(self, attempt: int, url: str, status_code: int | None) -> None:
        delay = self.BACKOFF_SECONDS * (2**attempt)
        logger.warning(
            "Retrying Jules API request",
            extra={
                "attempt": attempt + 1,
                "delay_seconds": delay,
                "status_code": status_code,
                "url": url,
            },
        )
        time.sleep(delay)

    def _map_http_status_error(self, exc: httpx.HTTPStatusError) -> ApiRequestError:
        response = exc.response
        message = response.text.strip() or response.reason_phrase
        details: dict[str, Any] = {"upstream_status": response.status_code}

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

        return ApiRequestError(message, status_code=response.status_code, details=details)

    def close(self) -> None:
        self._client.close()


class JulesApiClient:
    """Client for interacting with the Google Jules API."""

    BASE_URL = "https://jules.googleapis.com"
    API_VERSION = "v1alpha"

    def __init__(self):
        # Try to get API key from database settings first, then environment
        try:
            from .models import JulesSettings
            settings_obj = JulesSettings.get_settings()
            self.api_key = settings_obj.get_api_key()
        except Exception:
            self.api_key = None
        
        if not self.api_key:
            self.api_key = getattr(settings, "JULES_API_KEY", os.getenv("JULES_API_KEY"))
        
        if not self.api_key:
            raise ValueError("JULES_API_KEY must be set in settings or environment")
        self.headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }
        self._client = SharedHttpClient(self.headers)

    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        return f"{self.BASE_URL}/{self.API_VERSION}/{endpoint}"

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

    def list_sessions(self, page_size: int = 100, page_token: str | None = None) -> dict[str, Any]:
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
