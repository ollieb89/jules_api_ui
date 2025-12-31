from __future__ import annotations

from datetime import timezone as dt_timezone

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
        return timezone.make_aware(parsed, timezone=dt_timezone.utc)
    return parsed


def upsert_session(session_data: dict) -> JulesSession:
    name = session_data.get("name", "")
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
    session, created = JulesSession.objects.get_or_create(
        name=name,
        defaults=defaults,
    )
    if not created:
        has_changes = False
        for field_name, value in defaults.items():
            if getattr(session, field_name) != value:
                setattr(session, field_name, value)
                has_changes = True
        if has_changes:
            # Save only the fields that actually changed
            # last_synced_at is auto-updated by auto_now=True
            session.save(update_fields=list(defaults.keys()))
    return session


def detect_activity_type(activity_data: dict) -> str:
    for key in ("planGenerated", "planApproved", "progressUpdated", "sessionCompleted"):
        if activity_data.get(key):
            return key
    return ""


def upsert_activities(session: JulesSession, activities: list[dict]) -> None:
    for activity in activities:
        JulesActivity.objects.update_or_create(
            session=session,
            name=activity.get("name", ""),
            defaults={
                "activity_type": detect_activity_type(activity),
                "create_time": parse_api_datetime(
                    activity.get("createTime", activity.get("create_time"))
                ),
                "payload": activity,
            },
        )
