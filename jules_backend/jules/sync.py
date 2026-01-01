from __future__ import annotations

from .models import JulesSession
from .store import upsert_activity_from_api, upsert_session_from_api


def upsert_session(session_data: dict) -> JulesSession:
    return upsert_session_from_api(session_data)


def upsert_activities(session: JulesSession, activities: list[dict]) -> None:
    for activity in activities:
        upsert_activity_from_api(session, activity)

