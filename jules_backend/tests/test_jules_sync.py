from __future__ import annotations

from datetime import datetime, timezone

import pytest
from django.core.management import call_command

from jules.management.commands import sync_jules_sessions as command_module
from jules.models import JulesActivity, JulesSession
from jules.sync import detect_activity_type, parse_api_datetime, upsert_activities, upsert_session


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
    assert session.raw_payload["name"] == "sessions/123"


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
    assert activity.activity_type == "planGenerated"
    assert activity.create_time == datetime(2024, 1, 3, 9, 30, tzinfo=timezone.utc)


@pytest.mark.django_db
def test_sync_command_persists_sessions_and_activities(monkeypatch) -> None:
    class StubClient:
        def __init__(self) -> None:
            self.calls = 0

        def list_sessions(self, page_size: int, page_token: str | None = None) -> dict:
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
            self, session_id: str, page_size: int, page_token: str | None = None
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

    monkeypatch.setattr(command_module, "JulesApiClient", StubClient)

    call_command("sync_jules_sessions", page_size=50)

    session = JulesSession.objects.get(name="sessions/789")
    assert session.display_name == "Session 789"
    assert JulesActivity.objects.filter(session=session).count() == 1


@pytest.mark.django_db
def test_upsert_session_missing_name_raises_error() -> None:
    """Test that upsert_session raises ValueError when name is missing or empty."""
    session_data = {
        "displayName": "My Session",
        "state": "ACTIVE",
    }
    
    with pytest.raises(ValueError, match="JulesSession 'name' is required and must be non-empty"):
        upsert_session(session_data)
    
    # Test with empty string
    session_data["name"] = ""
    with pytest.raises(ValueError, match="JulesSession 'name' is required and must be non-empty"):
        upsert_session(session_data)
    
    # Test with whitespace only
    session_data["name"] = "   "
    with pytest.raises(ValueError, match="JulesSession 'name' is required and must be non-empty"):
        upsert_session(session_data)


@pytest.mark.django_db
def test_upsert_activities_skips_empty_names() -> None:
    """Test that upsert_activities skips activities with empty names."""
    session = JulesSession.objects.create(
        name="sessions/test",
        display_name="Test Session",
        state="ACTIVE",
        prompt="Test",
        source="sources/test",
    )
    
    activities = [
        {
            "name": "sessions/test/activities/1",
            "planGenerated": {"plan": {"steps": []}},
            "createTime": "2024-01-03T09:30:00Z",
        },
        {
            "name": "",  # Empty name, should be skipped
            "planGenerated": {"plan": {"steps": []}},
            "createTime": "2024-01-03T09:30:00Z",
        },
        {
            # Missing name, should be skipped
            "planGenerated": {"plan": {"steps": []}},
            "createTime": "2024-01-03T09:30:00Z",
        },
    ]
    
    upsert_activities(session, activities)
    
    # Only the first activity should be created
    assert JulesActivity.objects.filter(session=session).count() == 1
    activity = JulesActivity.objects.get(session=session)
    assert activity.name == "sessions/test/activities/1"


def test_parse_api_datetime_with_invalid_formats() -> None:
    """Test parse_api_datetime with various invalid formats."""
    # None or empty should return None
    assert parse_api_datetime(None) is None
    assert parse_api_datetime("") is None
    
    # Invalid date strings should return None
    assert parse_api_datetime("invalid-date") is None
    assert parse_api_datetime("2024-13-01T12:00:00Z") is None  # Invalid month
    
    # Valid date should work
    result = parse_api_datetime("2024-01-01T12:00:00Z")
    assert result is not None
    assert result.tzinfo is not None


def test_detect_activity_type_with_empty_or_missing_types() -> None:
    """Test detect_activity_type with various activity data."""
    # Empty activity should return empty string
    assert detect_activity_type({}) == ""
    
    # Activity with unknown type should return empty string
    assert detect_activity_type({"unknownType": {"data": "value"}}) == ""
    
    # Activity with valid types should return the type
    assert detect_activity_type({"planGenerated": {"plan": {}}}) == "planGenerated"
    assert detect_activity_type({"planApproved": {"plan": {}}}) == "planApproved"
    assert detect_activity_type({"progressUpdated": {"title": "Step"}}) == "progressUpdated"
    assert detect_activity_type({"sessionCompleted": {}}) == "sessionCompleted"


@pytest.mark.django_db
def test_sync_command_handles_api_errors(monkeypatch) -> None:
    """Test that sync command handles API errors gracefully."""
    class FailingClient:
        def __init__(self) -> None:
            raise ConnectionError("Failed to connect to API")
    
    monkeypatch.setattr(command_module, "JulesApiClient", FailingClient)
    
    # Command should not crash, but handle the error gracefully
    call_command("sync_jules_sessions")
    
    # No sessions should be synced
    assert JulesSession.objects.count() == 0


@pytest.mark.django_db
def test_sync_command_handles_list_sessions_failure(monkeypatch) -> None:
    """Test that sync command handles list_sessions API failures."""
    class FailingListClient:
        def __init__(self) -> None:
            pass
        
        def list_sessions(self, page_size: int, page_token: str | None = None) -> dict:
            raise RuntimeError("API error fetching sessions")
    
    monkeypatch.setattr(command_module, "JulesApiClient", FailingListClient)
    
    # Command should not crash
    call_command("sync_jules_sessions")
    
    # No sessions should be synced
    assert JulesSession.objects.count() == 0


@pytest.mark.django_db
def test_sync_command_handles_partial_failures(monkeypatch) -> None:
    """Test that sync command continues after partial failures."""
    class PartiallyFailingClient:
        def __init__(self) -> None:
            pass
        
        def list_sessions(self, page_size: int, page_token: str | None = None) -> dict:
            return {
                "sessions": [
                    {
                        "name": "sessions/good",
                        "displayName": "Good Session",
                        "state": "ACTIVE",
                        "prompt": "Test",
                        "source": "sources/test",
                    },
                    {
                        # Missing name, should fail validation
                        "displayName": "Bad Session",
                        "state": "ACTIVE",
                    },
                ],
                "nextPageToken": None,
            }
        
        def list_activities(
            self, session_id: str, page_size: int, page_token: str | None = None
        ) -> dict:
            return {"activities": [], "nextPageToken": None}
    
    monkeypatch.setattr(command_module, "JulesApiClient", PartiallyFailingClient)
    
    # Command should handle the error and continue
    call_command("sync_jules_sessions")
    
    # Only the good session should be synced
    assert JulesSession.objects.count() == 1
    session = JulesSession.objects.get(name="sessions/good")
    assert session.display_name == "Good Session"

