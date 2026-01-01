import logging
from typing import Any

from django.db import transaction

from .models import JulesSession
from .services import JulesApiClient
from .store import (
    is_activities_cache_fresh,
    is_sessions_cache_fresh,
    mark_sync_complete,
    mark_sync_failed,
    mark_sync_running,
    mark_activities_synced,
    mark_sessions_synced,
    normalize_session_name,
    upsert_activity_from_api,
    upsert_session_from_api,
)

logger = logging.getLogger(__name__)


def _sync_session_activities(
    client: JulesApiClient,
    session: JulesSession,
    force_refresh: bool,
) -> int:
    new_count = 0
    page_token: str | None = None
    session_name = normalize_session_name(session.name)

    if not force_refresh and is_activities_cache_fresh(session_name):
        return 0

    while True:
        data = client.list_activities(session_id=session_name, page_token=page_token)
        activities = data.get("activities", [])
        if not activities:
            break

        for activity in activities:
            upsert_activity_from_api(session, activity)
            new_count += 1

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    mark_activities_synced(session_name)
    return new_count


def poll_sessions_and_activities(force_refresh: bool = False) -> dict[str, Any]:
    """Poll sessions and activities from the Jules API and cache them."""
    mark_sync_running()
    client = JulesApiClient()
    page_token: str | None = None
    session_count = 0
    activity_count = 0

    if not force_refresh and is_sessions_cache_fresh():
        result = {"sessions": 0, "new_activities": 0, "skipped": True}
        mark_sync_complete(0, 0, skipped=True)
        return result

    try:
        while True:
            data = client.list_sessions(page_token=page_token)
            sessions = data.get("sessions", [])
            if not sessions:
                break

            for session_data in sessions:
                session_name = session_data.get("name")
                if not session_name:
                    continue
                with transaction.atomic():
                    session = upsert_session_from_api(session_data)
                session_count += 1
                activity_count += _sync_session_activities(
                    client,
                    session,
                    force_refresh=force_refresh,
                )

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        mark_sessions_synced()
        logger.info(
            "Jules polling complete. Sessions: %s, new activities: %s",
            session_count,
            activity_count,
        )
        mark_sync_complete(session_count, activity_count)
        return {"sessions": session_count, "new_activities": activity_count}
    except Exception as exc:
        mark_sync_failed(str(exc))
        raise
