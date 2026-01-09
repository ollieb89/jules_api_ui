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
        # Only update if data has changed
        has_changes = False
        update_fields = []
        for field_name, value in defaults.items():
            if getattr(session, field_name) != value:
                setattr(session, field_name, value)
                has_changes = True
                update_fields.append(field_name)
        
        if has_changes:
            # Include last_synced_at since auto_now=True doesn't work with update_fields
            update_fields.append("last_synced_at")
            # Manually set last_synced_at since auto_now won't trigger with update_fields
            session.last_synced_at = timezone.now()
            session.save(update_fields=update_fields)
        else:
            # Even when no data changes, update last_synced_at to track sync time
            session.last_synced_at = timezone.now()
            session.save(update_fields=["last_synced_at"])
    
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
