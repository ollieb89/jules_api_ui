import pytest
from django.utils import timezone

from jules.models import JulesActivity, JulesSession
from jules.sync import detect_activity_type, parse_api_datetime, upsert_activities, upsert_session


@pytest.mark.django_db
class TestParseApiDatetime:
    """Test suite for parse_api_datetime function."""

    def test_returns_none_for_none_input(self):
        assert parse_api_datetime(None) is None

    def test_returns_none_for_empty_string(self):
        assert parse_api_datetime("") is None

    def test_parses_naive_datetime_as_utc(self):
        result = parse_api_datetime("2025-01-01T12:00:00")
        assert result is not None
        assert result.tzinfo is not None
        assert result.year == 2025
        assert result.month == 1
        assert result.day == 1
        assert result.hour == 12

    def test_parses_aware_datetime(self):
        result = parse_api_datetime("2025-01-01T12:00:00Z")
        assert result is not None
        assert result.tzinfo is not None
        assert result.year == 2025

    def test_parses_datetime_with_timezone_offset(self):
        result = parse_api_datetime("2025-01-01T12:00:00+05:00")
        assert result is not None
        assert result.tzinfo is not None


@pytest.mark.django_db
class TestDetectActivityType:
    """Test suite for detect_activity_type function."""

    def test_detects_plan_generated(self):
        activity = {"planGenerated": {"plan": "some plan"}}
        assert detect_activity_type(activity) == "planGenerated"

    def test_detects_plan_approved(self):
        activity = {"planApproved": {"timestamp": "2025-01-01"}}
        assert detect_activity_type(activity) == "planApproved"

    def test_detects_progress_updated(self):
        activity = {"progressUpdated": {"progress": 50}}
        assert detect_activity_type(activity) == "progressUpdated"

    def test_detects_session_completed(self):
        activity = {"sessionCompleted": {"status": "success"}}
        assert detect_activity_type(activity) == "sessionCompleted"

    def test_returns_empty_string_for_unknown_type(self):
        activity = {"unknownType": {"data": "value"}}
        assert detect_activity_type(activity) == ""

    def test_returns_first_matching_type(self):
        activity = {
            "planGenerated": {"plan": "some plan"},
            "planApproved": {"timestamp": "2025-01-01"},
        }
        assert detect_activity_type(activity) == "planGenerated"

    def test_ignores_empty_dict_values(self):
        """Empty dicts should not be considered as valid activity types."""
        activity = {"planGenerated": {}, "planApproved": {"timestamp": "2025-01-01"}}
        assert detect_activity_type(activity) == "planApproved"

    def test_ignores_none_values(self):
        """None values should not be considered as valid activity types."""
        activity = {"planGenerated": None, "planApproved": {"timestamp": "2025-01-01"}}
        assert detect_activity_type(activity) == "planApproved"

    def test_ignores_false_values(self):
        """False values should not be considered as valid activity types."""
        activity = {"planGenerated": False, "planApproved": {"timestamp": "2025-01-01"}}
        assert detect_activity_type(activity) == "planApproved"


@pytest.mark.django_db
class TestUpsertSession:
    """Test suite for upsert_session function."""

    def test_creates_new_session_with_camel_case_fields(self):
        session_data = {
            "name": "sessions/123",
            "displayName": "Test Session",
            "state": "STATE_ACTIVE",
            "prompt": "Test prompt",
            "source": "github.com/test/repo",
            "createTime": "2025-01-01T10:00:00Z",
            "updateTime": "2025-01-01T11:00:00Z",
        }
        session = upsert_session(session_data)

        assert session.name == "sessions/123"
        assert session.display_name == "Test Session"
        assert session.state == "STATE_ACTIVE"
        assert session.prompt == "Test prompt"
        assert session.source == "github.com/test/repo"
        assert session.create_time is not None
        assert session.update_time is not None
        assert session.raw_payload == session_data

    def test_creates_new_session_with_snake_case_fields(self):
        session_data = {
            "name": "sessions/456",
            "display_name": "Test Session 2",
            "state": "STATE_PENDING",
            "prompt": "Another prompt",
            "source": "github.com/test/repo2",
            "create_time": "2025-01-01T10:00:00Z",
            "update_time": "2025-01-01T11:00:00Z",
        }
        session = upsert_session(session_data)

        assert session.name == "sessions/456"
        assert session.display_name == "Test Session 2"
        assert session.state == "STATE_PENDING"

    def test_updates_existing_session_with_changes(self):
        # Create initial session
        initial_data = {
            "name": "sessions/789",
            "displayName": "Initial Name",
            "state": "STATE_PENDING",
            "prompt": "Initial prompt",
            "source": "github.com/test/repo",
            "createTime": "2025-01-01T10:00:00Z",
            "updateTime": "2025-01-01T11:00:00Z",
        }
        session1 = upsert_session(initial_data)
        initial_sync_time = session1.last_synced_at

        # Update with new data
        updated_data = {
            "name": "sessions/789",
            "displayName": "Updated Name",
            "state": "STATE_ACTIVE",
            "prompt": "Updated prompt",
            "source": "github.com/test/repo",
            "createTime": "2025-01-01T10:00:00Z",
            "updateTime": "2025-01-01T12:00:00Z",
        }
        session2 = upsert_session(updated_data)

        # Verify it's the same session record
        assert session1.pk == session2.pk
        # Verify fields were updated
        assert session2.display_name == "Updated Name"
        assert session2.state == "STATE_ACTIVE"
        assert session2.prompt == "Updated prompt"
        # Verify last_synced_at was updated
        assert session2.last_synced_at > initial_sync_time

    def test_does_not_update_when_no_changes(self):
        # Create initial session
        session_data = {
            "name": "sessions/999",
            "displayName": "Unchanged",
            "state": "STATE_ACTIVE",
            "prompt": "Same prompt",
            "source": "github.com/test/repo",
            "createTime": "2025-01-01T10:00:00Z",
            "updateTime": "2025-01-01T11:00:00Z",
        }
        session1 = upsert_session(session_data)
        initial_sync_time = session1.last_synced_at

        # "Update" with same data
        session2 = upsert_session(session_data)

        # Verify it's the same session
        assert session1.pk == session2.pk
        # Verify last_synced_at was NOT updated (no changes detected)
        assert session2.last_synced_at == initial_sync_time

    def test_handles_missing_optional_fields(self):
        session_data = {
            "name": "sessions/minimal",
        }
        session = upsert_session(session_data)

        assert session.name == "sessions/minimal"
        assert session.display_name == ""
        assert session.state == "STATE_UNSPECIFIED"
        assert session.prompt == ""
        assert session.source == ""
        assert session.create_time is None
        assert session.update_time is None

    def test_prefers_camel_case_over_snake_case(self):
        """When both camelCase and snake_case are present, camelCase should take precedence."""
        session_data = {
            "name": "sessions/precedence",
            "displayName": "CamelCase Name",
            "display_name": "SnakeCase Name",
            "createTime": "2025-01-01T10:00:00Z",
            "create_time": "2025-01-02T10:00:00Z",
        }
        session = upsert_session(session_data)

        assert session.display_name == "CamelCase Name"
        assert session.create_time.day == 1  # From camelCase


@pytest.mark.django_db
class TestUpsertActivities:
    """Test suite for upsert_activities function."""

    def test_creates_new_activities(self):
        session = JulesSession.objects.create(
            name="sessions/test", display_name="Test", state="STATE_ACTIVE"
        )
        activities = [
            {
                "name": "activities/1",
                "planGenerated": {"plan": "test plan"},
                "createTime": "2025-01-01T10:00:00Z",
            },
            {
                "name": "activities/2",
                "planApproved": {"timestamp": "2025-01-01T11:00:00Z"},
                "createTime": "2025-01-01T11:00:00Z",
            },
        ]

        upsert_activities(session, activities)

        saved_activities = JulesActivity.objects.filter(session=session).order_by("name")
        assert saved_activities.count() == 2
        assert saved_activities[0].name == "activities/1"
        assert saved_activities[0].activity_type == "planGenerated"
        assert saved_activities[1].name == "activities/2"
        assert saved_activities[1].activity_type == "planApproved"

    def test_updates_existing_activities(self):
        session = JulesSession.objects.create(
            name="sessions/test2", display_name="Test 2", state="STATE_ACTIVE"
        )

        # Create initial activity
        initial_activities = [
            {
                "name": "activities/update",
                "planGenerated": {"plan": "initial plan"},
                "createTime": "2025-01-01T10:00:00Z",
            }
        ]
        upsert_activities(session, initial_activities)

        # Update the activity
        updated_activities = [
            {
                "name": "activities/update",
                "planApproved": {"timestamp": "2025-01-01T11:00:00Z"},
                "createTime": "2025-01-01T11:00:00Z",
            }
        ]
        upsert_activities(session, updated_activities)

        activity = JulesActivity.objects.get(session=session, name="activities/update")
        assert activity.activity_type == "planApproved"

    def test_handles_empty_activities_list(self):
        session = JulesSession.objects.create(
            name="sessions/empty", display_name="Empty", state="STATE_ACTIVE"
        )

        upsert_activities(session, [])

        assert JulesActivity.objects.filter(session=session).count() == 0

    def test_handles_activities_with_snake_case_fields(self):
        session = JulesSession.objects.create(
            name="sessions/snake", display_name="Snake", state="STATE_ACTIVE"
        )
        activities = [
            {
                "name": "activities/snake",
                "planGenerated": {"plan": "test"},
                "create_time": "2025-01-01T10:00:00Z",
            }
        ]

        upsert_activities(session, activities)

        activity = JulesActivity.objects.get(session=session)
        assert activity.create_time is not None

    def test_preserves_full_payload(self):
        session = JulesSession.objects.create(
            name="sessions/payload", display_name="Payload", state="STATE_ACTIVE"
        )
        activities = [
            {
                "name": "activities/payload",
                "planGenerated": {"plan": "test", "extra": "data"},
                "createTime": "2025-01-01T10:00:00Z",
                "customField": "custom value",
            }
        ]

        upsert_activities(session, activities)

        activity = JulesActivity.objects.get(session=session)
        assert activity.payload["customField"] == "custom value"
        assert activity.payload["planGenerated"]["extra"] == "data"
