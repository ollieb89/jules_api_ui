import logging
from typing import Any

from django.db import transaction
from django.utils.dateparse import parse_datetime

from .models import JulesActivity, JulesSession
from .services import JulesApiClient

logger = logging.getLogger(__name__)


def _extract_activity_type(activity: dict[str, Any]) -> str:
    for key in ("planGenerated", "planApproved", "progressUpdated", "sessionCompleted"):
        if activity.get(key) is not None:
            return key
    return "unknown"


def _sync_session_activities(session: JulesSession) -> int:
    client = JulesApiClient()
    new_count = 0
    page_token: str | None = None

    while True:
        data = client.list_activities(session_id=session.session_id, page_token=page_token)
        activities = data.get("activities", [])
        if not activities:
            break

        activity_names = [activity.get("name", "") for activity in activities]
        existing_names = set(
            JulesActivity.objects.filter(
                session=session, name__in=activity_names
            ).values_list("name", flat=True)
        )

        for activity in activities:
            name = activity.get("name")
            if not name or name in existing_names:
                continue
            create_time = parse_datetime(activity.get("createTime", ""))
            activity_type = _extract_activity_type(activity)
            JulesActivity.objects.create(
                session=session,
                name=name,
                activity_type=activity_type,
                payload=activity,
                create_time=create_time,
            )
            new_count += 1

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    session.mark_polled()
    return new_count


def poll_sessions_and_activities() -> dict[str, Any]:
    """Poll sessions and activities from the Jules API and cache them."""
    client = JulesApiClient()
    page_token: str | None = None
    session_count = 0
    activity_count = 0

    while True:
        data = client.list_sessions(page_token=page_token)
        sessions = data.get("sessions", [])
        if not sessions:
            break

        for session_data in sessions:
            session_id = session_data.get("name")
            if not session_id:
                continue
            create_time = parse_datetime(session_data.get("createTime", ""))
            with transaction.atomic():
                session, _ = JulesSession.objects.update_or_create(
                    session_id=session_id,
                    defaults={
                        "source": session_data.get("source", ""),
                        "state": session_data.get("state", ""),
                        "create_time": create_time,
                    },
                )
            session_count += 1
            activity_count += _sync_session_activities(session)

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    logger.info(
        "Jules polling complete. Sessions: %s, new activities: %s",
        session_count,
        activity_count,
    )
    return {"sessions": session_count, "new_activities": activity_count}
