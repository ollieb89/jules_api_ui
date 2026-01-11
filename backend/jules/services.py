import atexit
import logging
import time
from dataclasses import dataclass
from typing import Any, Mapping

import httpx
from django.conf import settings

from .exceptions.api_error import ApiRequestError
from .utils import get_correlation_id, log_jules_api_call, sanitize_url

logger = logging.getLogger(__name__)

RETRY_STATUS_CODES = set(getattr(settings, "JULES_API_RETRY_STATUS_CODES", {429, 502, 503, 504}))
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
RETRY_POLICIES: Mapping[str, Any] = getattr(
    settings,
    "JULES_API_RETRY_POLICIES",
    {
        "default": {
            "max_retries": MAX_RETRIES,
            "backoff_seconds": BACKOFF_SECONDS,
            "status_codes": RETRY_STATUS_CODES,
        }
    },
)


@dataclass(frozen=True)
class RetryPolicy:
    max_retries: int
    backoff_seconds: float
    status_codes: set[int]

_shared_httpx_client: httpx.Client | None = None


def _coerce_timeout(value: Any) -> httpx.Timeout:
    if isinstance(value, httpx.Timeout):
        return value
    if isinstance(value, (int, float)):
        return httpx.Timeout(float(value))
    if isinstance(value, Mapping):
        return httpx.Timeout(**value)
    return httpx.Timeout(30.0)


def _resolve_timeout(timeout_policy: str) -> httpx.Timeout:
    default_timeout = _coerce_timeout(TIMEOUT_POLICIES.get("default"))
    policy_value = TIMEOUT_POLICIES.get(timeout_policy, default_timeout)
    return _coerce_timeout(policy_value) or default_timeout


def _coerce_retry_policy(value: Any, default: RetryPolicy) -> RetryPolicy:
    if isinstance(value, RetryPolicy):
        return value
    if isinstance(value, Mapping):
        max_retries = int(value.get("max_retries", default.max_retries))
        backoff_seconds = float(value.get("backoff_seconds", default.backoff_seconds))
        status_codes = {
            int(code) for code in value.get("status_codes", default.status_codes)
        }
        return RetryPolicy(
            max_retries=max_retries,
            backoff_seconds=backoff_seconds,
            status_codes=status_codes,
        )
    return default


def _resolve_retry_policy(retry_policy: str) -> RetryPolicy:
    default_policy = RetryPolicy(
        max_retries=MAX_RETRIES,
        backoff_seconds=BACKOFF_SECONDS,
        status_codes=set(RETRY_STATUS_CODES),
    )
    policy_value = RETRY_POLICIES.get(retry_policy, default_policy)
    return _coerce_retry_policy(policy_value, default_policy)


def get_shared_httpx_client() -> httpx.Client:
    global _shared_httpx_client
    if _shared_httpx_client is None:
        _shared_httpx_client = httpx.Client(timeout=_resolve_timeout("default"))
    return _shared_httpx_client


def close_shared_httpx_client() -> None:
    global _shared_httpx_client
    if _shared_httpx_client is None:
        return
    _shared_httpx_client.close()
    _shared_httpx_client = None


atexit.register(close_shared_httpx_client)


class SharedHttpClient:
    """Shared HTTP client with retry, backoff, and timeout policies."""

    def __init__(self, headers: dict[str, str]) -> None:
        self._client = get_shared_httpx_client()
        self._default_headers = headers

    def request(
        self,
        method: str,
        url: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        timeout_policy: str = "default",
        retry_policy: str = "default",
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        timeout = _resolve_timeout(timeout_policy)
        policy = _resolve_retry_policy(retry_policy)
        request_headers = {**self._default_headers, **(headers or {})}
        correlation_id = get_correlation_id()
        log_metadata = bool(getattr(settings, "JULES_API_LOG_METADATA", False))
        if correlation_id and not (
            request_headers.get("X-Correlation-ID") or request_headers.get("X-Request-ID")
        ):
            request_headers["X-Correlation-ID"] = correlation_id

        for attempt in range(policy.max_retries + 1):
            start_time = time.monotonic()
            try:
                response = self._client.request(
                    method,
                    url,
                    json=json,
                    params=params,
                    data=data,
                    headers=request_headers,
                    timeout=timeout,
                )

                if response.status_code in policy.status_codes and attempt < policy.max_retries:
                    self._sleep_backoff(attempt, url, response.status_code, response, policy)
                    continue

                response.raise_for_status()
                log_jules_api_call(
                    method=method,
                    url=url,
                    status_code=response.status_code,
                    duration_s=time.monotonic() - start_time,
                    response_bytes=len(response.content),
                    request_headers=request_headers if log_metadata else None,
                    response_headers=dict(response.headers) if log_metadata else None,
                    request_params=params if log_metadata else None,
                )
                return response
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if status_code in policy.status_codes and attempt < policy.max_retries:
                    self._sleep_backoff(attempt, url, status_code, exc.response, policy)
                    continue
                log_jules_api_call(
                    method=method,
                    url=url,
                    status_code=status_code,
                    duration_s=time.monotonic() - start_time,
                    response_bytes=len(exc.response.content),
                    error=exc.__class__.__name__,
                    request_headers=request_headers if log_metadata else None,
                    response_headers=dict(exc.response.headers) if log_metadata else None,
                    request_params=params if log_metadata else None,
                )
                raise self._map_http_status_error(exc, attempt, policy) from exc
            except httpx.RequestError as exc:
                if attempt < policy.max_retries:
                    self._sleep_backoff(attempt, url, None, None, policy)
                    continue
                log_jules_api_call(
                    method=method,
                    url=url,
                    duration_s=time.monotonic() - start_time,
                    error=exc.__class__.__name__,
                    request_headers=request_headers if log_metadata else None,
                    request_params=params if log_metadata else None,
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
                    retry_after=self._calculate_backoff(attempt, None, policy),
                ) from exc

        raise ApiRequestError(
            "Upstream request failed.",
            status_code=503,
            user_message="Upstream service is unavailable. Please try again shortly.",
            retry_after=self._calculate_backoff(policy.max_retries, None, policy),
        )

    def _sleep_backoff(
        self,
        attempt: int,
        url: str,
        status_code: int | None,
        response: httpx.Response | None,
        policy: RetryPolicy,
    ) -> None:
        delay = self._calculate_backoff(attempt, response, policy)
        log_extra: dict[str, Any] = {
            "attempt": attempt + 1,
            "delay_seconds": delay,
            "status_code": status_code,
            "url": sanitize_url(url),
        }
        correlation_id = get_correlation_id()
        if correlation_id:
            log_extra["correlation_id"] = correlation_id
        logger.warning(
            "Retrying Jules API request",
            extra=log_extra,
        )
        time.sleep(delay)

    def _calculate_backoff(
        self,
        attempt: int,
        response: httpx.Response | None,
        policy: RetryPolicy,
    ) -> float:
        retry_after = self._parse_retry_after(response) if response else None
        if retry_after is not None:
            return retry_after
        return policy.backoff_seconds * (2**attempt)

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

    def _map_http_status_error(
        self,
        exc: httpx.HTTPStatusError,
        attempt: int,
        policy: RetryPolicy,
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

        if response.status_code in policy.status_codes:
            details["retryable"] = True
            details["retry_after_seconds"] = retry_after or self._calculate_backoff(
                attempt, response, policy
            )
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
        close_shared_httpx_client()


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
        self.base_url = settings.JULES_API_BASE_URL.rstrip("/")
        self.api_version = settings.JULES_API_VERSION.strip("/")
        self.headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }
        self._client = SharedHttpClient(self.headers)

    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        normalized_endpoint = endpoint.lstrip("/")
        return f"{self.base_url}/{self.api_version}/{normalized_endpoint}"

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
