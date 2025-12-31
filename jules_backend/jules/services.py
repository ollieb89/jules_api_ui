import os
import time
from typing import Any

import httpx
from django.conf import settings

DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
MAX_RETRIES = 3
BACKOFF_FACTOR = 0.5
RETRY_STATUS_CODES = {408, 429, 500, 502, 503, 504}
_CLIENT = httpx.Client(timeout=DEFAULT_TIMEOUT)


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
        self.client = _CLIENT

    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        return f"{self.BASE_URL}/{self.API_VERSION}/{endpoint}"

    def _get_backoff_delay(self, attempt: int, response: httpx.Response | None = None) -> float:
        if response is not None:
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                try:
                    return float(retry_after)
                except ValueError:
                    pass
        return BACKOFF_FACTOR * (2**attempt)

    def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self.client.request(method, url, timeout=DEFAULT_TIMEOUT, **kwargs)
            except httpx.TimeoutException:
                if attempt >= MAX_RETRIES:
                    raise
                time.sleep(self._get_backoff_delay(attempt))
                continue
            except httpx.RequestError:
                if attempt >= MAX_RETRIES:
                    raise
                time.sleep(self._get_backoff_delay(attempt))
                continue

            if response.status_code in RETRY_STATUS_CODES and attempt < MAX_RETRIES:
                response.close()
                time.sleep(self._get_backoff_delay(attempt, response))
                continue

            response.raise_for_status()
            return response

        raise httpx.HTTPError("Upstream request failed after retries.")

    def list_sources(self) -> dict[str, Any]:
        """List all connected GitHub repositories."""
        url = self._get_url("sources")
        response = self._request("GET", url, headers=self.headers)
        return response.json()

    def create_session(self, prompt: str, source: str) -> dict[str, Any]:
        """Create a new coding session."""
        url = self._get_url("sessions")
        payload = {
            "prompt": prompt,
            "source": source,
        }
        response = self._request("POST", url, headers=self.headers, json=payload)
        return response.json()

    def list_sessions(self, page_size: int = 100, page_token: str | None = None) -> dict[str, Any]:
        """List all sessions with pagination."""
        url = self._get_url("sessions")
        params: dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        response = self._request("GET", url, headers=self.headers, params=params)
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
        response = self._request("GET", url, headers=self.headers)
        return response.json()

    def delete_session(self, session_id: str) -> None:
        """Delete a session."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(normalized_id)
        response = self._request("DELETE", url, headers=self.headers)
        response.raise_for_status()

    def approve_plan(self, session_id: str) -> dict[str, Any]:
        """Approve a generated plan."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:approvePlan")
        response = self._request("POST", url, headers=self.headers)
        return response.json()

    def send_message(self, session_id: str, message: str) -> dict[str, Any]:
        """Send a message to the agent."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:sendMessage")
        payload = {"message": message}
        response = self._request("POST", url, headers=self.headers, json=payload)
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
        response = self._request("GET", url, headers=self.headers, params=params)
        return response.json()
