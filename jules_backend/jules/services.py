import os
from typing import Any

import httpx
from django.conf import settings


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
            self.api_key = getattr(settings, "JULES_API_KEY", os.getenv("JULES_API_KEY"))

        if not self.api_key:
            raise ValueError("JULES_API_KEY must be set in settings or environment")
        self.base_url = settings.JULES_API_BASE_URL
        self.api_version = settings.JULES_API_VERSION
        self.headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }

    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        return f"{self.base_url}/{self.api_version}/{endpoint}"

    def list_sources(self) -> dict[str, Any]:
        """List all connected GitHub repositories."""
        url = self._get_url("sources")
        with httpx.Client() as client:
            response = client.get(url, headers=self.headers, timeout=30.0)
            response.raise_for_status()
            return response.json()

    def create_session(self, prompt: str, source: str) -> dict[str, Any]:
        """Create a new coding session."""
        url = self._get_url("sessions")
        payload = {
            "prompt": prompt,
            "source": source,
        }
        with httpx.Client() as client:
            response = client.post(url, headers=self.headers, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()

    def list_sessions(self, page_size: int = 100, page_token: str | None = None) -> dict[str, Any]:
        """List all sessions with pagination."""
        url = self._get_url("sessions")
        params: dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        with httpx.Client() as client:
            response = client.get(url, headers=self.headers, params=params, timeout=30.0)
            response.raise_for_status()
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
        with httpx.Client() as client:
            response = client.get(url, headers=self.headers, timeout=30.0)
            response.raise_for_status()
            return response.json()

    def delete_session(self, session_id: str) -> None:
        """Delete a session."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(normalized_id)
        with httpx.Client() as client:
            response = client.delete(url, headers=self.headers, timeout=30.0)
            response.raise_for_status()

    def approve_plan(self, session_id: str) -> dict[str, Any]:
        """Approve a generated plan."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:approvePlan")
        with httpx.Client() as client:
            response = client.post(url, headers=self.headers, timeout=30.0)
            response.raise_for_status()
            return response.json()

    def send_message(self, session_id: str, message: str) -> dict[str, Any]:
        """Send a message to the agent."""
        normalized_id = self._normalize_session_id(session_id)
        url = self._get_url(f"{normalized_id}:sendMessage")
        payload = {"message": message}
        with httpx.Client() as client:
            response = client.post(url, headers=self.headers, json=payload, timeout=30.0)
            response.raise_for_status()
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
        with httpx.Client() as client:
            response = client.get(url, headers=self.headers, params=params, timeout=30.0)
            response.raise_for_status()
            return response.json()
