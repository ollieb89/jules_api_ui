from __future__ import annotations

from datetime import datetime, timezone

import pytest
from django.core.management import call_command

from jules.management.commands import sync_jules_sessions as command_module
from jules.models import JulesActivity, JulesSession
from jules.sync import upsert_activities, upsert_session


@pytest.mark.django_db
def test_upsert_session_persists_fields() -> None:
    session_data = {
        "name": "sessions/123",
        "displayName": "My Session",
        "state": "ACTIVE",
        "prompt": "Do the thing",
        "source": "sources/alpha",
        "createTime": "2024-01-01T12:00:00Z",
        "updateTime": "2024-01-02T12:00:00Z",
    }

    session = upsert_session(session_data)

    assert session.name == "sessions/123"
    assert session.display_name == "My Session"
    assert session.state == "ACTIVE"
    assert session.prompt == "Do the thing"
    assert session.source == "sources/alpha"
    assert session.create_time == datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    assert session.update_time == datetime(2024, 1, 2, 12, 0, tzinfo=timezone.utc)
    assert session.last_synced_at is not None


@pytest.mark.django_db
def test_upsert_activities_deduplicates() -> None:
    session = JulesSession.objects.create(
        name="sessions/456",
        display_name="Session 456",
        state="ACTIVE",
        prompt="Hello",
        source="sources/beta",
    )
    activities = [
        {
            "name": "sessions/456/activities/1",
            "planGenerated": {"plan": {"steps": []}},
            "createTime": "2024-01-03T09:30:00Z",
        }
    ]

    upsert_activities(session, activities)
    upsert_activities(session, activities)

    activity = JulesActivity.objects.get(session=session)
    assert JulesActivity.objects.count() == 1
    assert activity.activity_type == JulesActivity.TYPE_PLAN_GENERATED
    assert activity.create_time == datetime(2024, 1, 3, 9, 30, tzinfo=timezone.utc)


@pytest.mark.django_db
def test_sync_command_persists_sessions_and_activities(monkeypatch) -> None:
    class StubClient:
        def __init__(self) -> None:
            self.calls = 0

        def list_sessions(self, page_size: int = 100, page_token: str | None = None) -> dict:
            if self.calls == 0:
                self.calls += 1
                return {
                    "sessions": [
                        {
                            "name": "sessions/789",
                            "displayName": "Session 789",
                            "state": "ACTIVE",
                            "prompt": "Sync me",
                            "source": "sources/gamma",
                            "createTime": "2024-01-04T10:00:00Z",
                            "updateTime": "2024-01-05T10:00:00Z",
                        }
                    ],
                    "nextPageToken": None,
                }
            return {"sessions": [], "nextPageToken": None}

        def list_activities(
            self, session_id: str, page_size: int = 100, page_token: str | None = None
        ) -> dict:
            return {
                "activities": [
                    {
                        "name": "sessions/789/activities/2",
                        "progressUpdated": {"title": "Step"},
                        "createTime": "2024-01-04T11:00:00Z",
                    }
                ],
                "nextPageToken": None,
            }

    # The command uses poll_sessions_and_activities from tasks.py
    # and tasks.py imports JulesApiClient from services.py
    monkeypatch.setattr("jules.tasks.JulesApiClient", StubClient)

    # We also need to monkeypatch is_sessions_cache_fresh and is_activities_cache_fresh
    # or ensure they return false so the sync happens
    monkeypatch.setattr("jules.tasks.is_sessions_cache_fresh", lambda: False)
    monkeypatch.setattr("jules.tasks.is_activities_cache_fresh", lambda x: False)

    call_command("sync_jules_sessions", interval=0)

    session = JulesSession.objects.get(name="sessions/789")
    assert session.display_name == "Session 789"
    assert JulesActivity.objects.filter(session=session).count() == 1
