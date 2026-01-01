from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.core.cache import cache
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import JulesActivity, JulesSession

SESSION_SYNC_TTL_SECONDS = 60
ACTIVITY_SYNC_TTL_SECONDS = 30

SESSION_SYNC_CACHE_KEY = "jules:sessions:last_sync"
ACTIVITY_SYNC_CACHE_KEY_TEMPLATE = "jules:sessions:{session_id}:activities:last_sync"
SYNC_STATUS_CACHE_KEY = "jules:sync:status"

SYNC_STATUS_TTL_SECONDS = 3600


def normalize_session_name(session_id: str) -> str:
    if session_id.startswith("sessions/"):
        return session_id
    return f"sessions/{session_id}"


def is_sessions_cache_fresh() -> bool:
    return cache.get(SESSION_SYNC_CACHE_KEY) is not None


def mark_sessions_synced() -> None:
    cache.set(SESSION_SYNC_CACHE_KEY, timezone.now().isoformat(), SESSION_SYNC_TTL_SECONDS)


def is_activities_cache_fresh(session_id: str) -> bool:
    cache_key = ACTIVITY_SYNC_CACHE_KEY_TEMPLATE.format(session_id=session_id)
    return cache.get(cache_key) is not None


def mark_activities_synced(session_id: str) -> None:
    cache_key = ACTIVITY_SYNC_CACHE_KEY_TEMPLATE.format(session_id=session_id)
    cache.set(cache_key, timezone.now().isoformat(), ACTIVITY_SYNC_TTL_SECONDS)


def _default_sync_status() -> dict[str, Any]:
    return {
        "state": "idle",
        "started_at": None,
        "finished_at": None,
        "sessions": 0,
        "new_activities": 0,
        "skipped": False,
        "error": None,
        "updated_at": None,
    }


def get_sync_status() -> dict[str, Any]:
    cached = cache.get(SYNC_STATUS_CACHE_KEY)
    if cached:
        return cached
    return _default_sync_status()


def _set_sync_status(payload: dict[str, Any]) -> dict[str, Any]:
    cache.set(SYNC_STATUS_CACHE_KEY, payload, SYNC_STATUS_TTL_SECONDS)
    return payload


def mark_sync_running() -> dict[str, Any]:
    now = timezone.now().isoformat()
    status = _default_sync_status()
    status.update(
        {
            "state": "running",
            "started_at": now,
            "updated_at": now,
        }
    )
    return _set_sync_status(status)


def mark_sync_complete(
    sessions: int,
    new_activities: int,
    skipped: bool = False,
) -> dict[str, Any]:
    now = timezone.now().isoformat()
    status = get_sync_status()
    started_at = status.get("started_at")
    status = _default_sync_status()
    status.update(
        {
            "state": "completed" if not skipped else "skipped",
            "started_at": started_at,
            "finished_at": now,
            "sessions": sessions,
            "new_activities": new_activities,
            "skipped": skipped,
            "updated_at": now,
        }
    )
    return _set_sync_status(status)


def mark_sync_failed(error: str) -> dict[str, Any]:
    now = timezone.now().isoformat()
    status = get_sync_status()
    started_at = status.get("started_at")
    status = _default_sync_status()
    status.update(
        {
            "state": "error",
            "started_at": started_at,
            "finished_at": now,
            "error": error,
            "updated_at": now,
        }
    )
    return _set_sync_status(status)


def is_session_fresh(session: JulesSession) -> bool:
    if not session.last_synced_at:
        return False
    return timezone.now() - session.last_synced_at <= timedelta(seconds=SESSION_SYNC_TTL_SECONDS)


def _ensure_aware(value):
    if value is None:
        return None
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone.get_current_timezone())
    return value


def _parse_datetime(value: str | None):
    if not value:
        return None
    parsed = parse_datetime(value)
    return _ensure_aware(parsed)


def session_to_api_dict(session: JulesSession) -> dict[str, Any]:
    return {
        "name": session.name,
        "displayName": session.display_name,
        "state": session.state,
        "prompt": session.prompt,
        "source": session.source,
        "createTime": session.create_time.isoformat() if session.create_time else "",
        "updateTime": session.update_time.isoformat() if session.update_time else "",
    }


def activity_to_api_dict(activity: JulesActivity) -> dict[str, Any]:
    payload = activity.payload or {}
    data: dict[str, Any] = {
        "name": activity.name,
        "createTime": activity.create_time.isoformat() if activity.create_time else "",
    }
    if activity.activity_type == JulesActivity.TYPE_PLAN_GENERATED:
        data["planGenerated"] = payload
    elif activity.activity_type == JulesActivity.TYPE_PLAN_APPROVED:
        data["planApproved"] = payload
    elif activity.activity_type == JulesActivity.TYPE_PROGRESS_UPDATED:
        data["progressUpdated"] = payload
    elif activity.activity_type == JulesActivity.TYPE_SESSION_COMPLETED:
        data["sessionCompleted"] = payload
    return data


def get_cached_sessions_payload() -> list[dict[str, Any]]:
    sessions = JulesSession.objects.order_by("-update_time", "-create_time", "name")
    return [session_to_api_dict(session) for session in sessions]


def get_cached_activities_payload(session_name: str) -> list[dict[str, Any]]:
    activities = JulesActivity.objects.filter(session__name=session_name).order_by(
        "create_time", "name"
    )
    return [activity_to_api_dict(activity) for activity in activities]


def upsert_session_from_api(session_data: dict[str, Any]) -> JulesSession:
    now = timezone.now()
    session_name = session_data.get("name", "")
    defaults = {
        "display_name": session_data.get("displayName")
        or session_data.get("display_name")
        or "",
        "state": session_data.get("state", "STATE_UNSPECIFIED") or "STATE_UNSPECIFIED",
        "prompt": session_data.get("prompt", ""),
        "source": session_data.get("source", ""),
        "create_time": _parse_datetime(
            session_data.get("createTime") or session_data.get("create_time")
        ),
        "update_time": _parse_datetime(
            session_data.get("updateTime") or session_data.get("update_time")
        ),
        "last_synced_at": now,
    }
    session, _ = JulesSession.objects.update_or_create(name=session_name, defaults=defaults)
    return session


def upsert_activity_from_api(
    session: JulesSession,
    activity_data: dict[str, Any],
) -> JulesActivity:
    now = timezone.now()
    activity_type = JulesActivity.TYPE_UNKNOWN
    payload: dict[str, Any] = {}

    if activity_data.get("planGenerated") or activity_data.get("plan_generated"):
        activity_type = JulesActivity.TYPE_PLAN_GENERATED
        payload = activity_data.get("planGenerated") or activity_data.get("plan_generated") or {}
    elif activity_data.get("planApproved") or activity_data.get("plan_approved"):
        activity_type = JulesActivity.TYPE_PLAN_APPROVED
        payload = activity_data.get("planApproved") or activity_data.get("plan_approved") or {}
    elif activity_data.get("progressUpdated") or activity_data.get("progress_updated"):
        activity_type = JulesActivity.TYPE_PROGRESS_UPDATED
        payload = (
            activity_data.get("progressUpdated")
            or activity_data.get("progress_updated")
            or {}
        )
    elif activity_data.get("sessionCompleted") or activity_data.get("session_completed"):
        activity_type = JulesActivity.TYPE_SESSION_COMPLETED
        payload = (
            activity_data.get("sessionCompleted")
            or activity_data.get("session_completed")
            or {}
        )

    defaults = {
        "session": session,
        "activity_type": activity_type,
        "payload": payload,
        "create_time": _parse_datetime(
            activity_data.get("createTime") or activity_data.get("create_time")
        ),
        "last_synced_at": now,
    }
    activity, _ = JulesActivity.objects.update_or_create(
        name=activity_data.get("name", ""),
        defaults=defaults,
    )
    return activity


def get_or_create_session_stub(session_name: str) -> JulesSession:
    session, _ = JulesSession.objects.get_or_create(
        name=session_name,
        defaults={
            "display_name": "",
            "state": "STATE_UNSPECIFIED",
            "prompt": "",
            "source": "",
        },
    )
    return session
