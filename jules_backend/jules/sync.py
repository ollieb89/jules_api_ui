from __future__ import annotations

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import JulesActivity, JulesSession


def parse_api_datetime(value: str | None) -> timezone.datetime | None:
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        return None
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, timezone=timezone.utc)
    return parsed


def upsert_session(session_data: dict) -> JulesSession:
    name = session_data.get("name", "")
    if not name or not str(name).strip():
        raise ValueError("JulesSession 'name' is required and must be non-empty")
    defaults = {
        "display_name": session_data.get(
            "displayName", session_data.get("display_name", "")
        ),
        "state": session_data.get("state", "STATE_UNSPECIFIED"),
        "prompt": session_data.get("prompt", ""),
        "source": session_data.get("source", ""),
        "create_time": parse_api_datetime(
            session_data.get("createTime", session_data.get("create_time"))
        ),
        "update_time": parse_api_datetime(
            session_data.get("updateTime", session_data.get("update_time"))
        ),
        "raw_payload": session_data,
    }
    session, _ = JulesSession.objects.update_or_create(name=name, defaults=defaults)
    return session


def detect_activity_type(activity_data: dict) -> str:
    for key in ("planGenerated", "planApproved", "progressUpdated", "sessionCompleted"):
        if activity_data.get(key) is not None:
            return key
    return ""


def upsert_activities(session: JulesSession, activities: list[dict]) -> None:
    for activity in activities:
        name = activity.get("name", "")
        if not name or not str(name).strip():
            # Skip activities without a valid non-empty name to avoid
            # violating the unique (session, name) constraint.
            continue
        JulesActivity.objects.update_or_create(
            session=session,
            name=name,
            defaults={
                "activity_type": detect_activity_type(activity),
                "create_time": parse_api_datetime(
                    activity.get("createTime", activity.get("create_time"))
                ),
                "payload": activity,
            },
        )
