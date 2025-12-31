import pytest
from datetime import datetime
from django.utils import timezone
from jules.models import JulesSession, JulesActivity
from jules.sync import parse_api_datetime, upsert_session, detect_activity_type, upsert_activities


@pytest.mark.django_db
class TestParseApiDatetime:
    """Tests for parse_api_datetime function."""

    def test_parse_none(self):
        """Should return None for None input."""
        assert parse_api_datetime(None) is None

    def test_parse_empty_string(self):
        """Should return None for empty string."""
        assert parse_api_datetime("") is None

    def test_parse_invalid_datetime(self):
        """Should return None for invalid datetime string."""
        assert parse_api_datetime("not-a-datetime") is None

    def test_parse_naive_datetime(self):
        """Should make naive datetime timezone-aware (UTC)."""
        result = parse_api_datetime("2025-12-31T10:00:00")
        assert result is not None
        assert timezone.is_aware(result)
        assert result.tzinfo == timezone.utc

    def test_parse_aware_datetime(self):
        """Should preserve timezone-aware datetime."""
        result = parse_api_datetime("2025-12-31T10:00:00Z")
        assert result is not None
        assert timezone.is_aware(result)


@pytest.mark.django_db
class TestUpsertSession:
    """Tests for upsert_session function."""

    def test_create_new_session(self):
        """Should create a new session with provided data."""
        session_data = {
            "name": "sessions/test123",
            "displayName": "Test Session",
            "state": "STATE_ACTIVE",
            "prompt": "Test prompt",
            "source": "test/source",
            "createTime": "2025-12-31T10:00:00Z",
            "updateTime": "2025-12-31T11:00:00Z",
        }
        
        session = upsert_session(session_data)
        
        assert session.name == "sessions/test123"
        assert session.display_name == "Test Session"
        assert session.state == "STATE_ACTIVE"
        assert session.prompt == "Test prompt"
        assert session.source == "test/source"
        assert session.create_time is not None
        assert session.update_time is not None
        assert session.raw_payload == session_data

    def test_update_existing_session(self):
        """Should update existing session when data changes."""
        # Create initial session
        session = JulesSession.objects.create(
            name="sessions/test123",
            display_name="Old Name",
            state="STATE_UNSPECIFIED",
            prompt="Old prompt",
            source="old/source",
        )
        
        # Update with new data
        session_data = {
            "name": "sessions/test123",
            "displayName": "New Name",
            "state": "STATE_ACTIVE",
            "prompt": "New prompt",
            "source": "new/source",
        }
        
        updated_session = upsert_session(session_data)
        
        assert updated_session.id == session.id
        assert updated_session.display_name == "New Name"
        assert updated_session.state == "STATE_ACTIVE"
        assert updated_session.prompt == "New prompt"
        assert updated_session.source == "new/source"

    def test_no_update_when_data_unchanged(self):
        """Should not update session when data hasn't changed."""
        session_data = {
            "name": "sessions/test123",
            "displayName": "Test Session",
            "state": "STATE_ACTIVE",
            "prompt": "Test prompt",
            "source": "test/source",
        }
        
        # Create session
        session1 = upsert_session(session_data)
        first_synced = session1.last_synced_at
        
        # Call upsert again with same data
        session2 = upsert_session(session_data)
        
        assert session1.id == session2.id
        # last_synced_at should not change if no data changed
        assert session2.last_synced_at == first_synced

    def test_handle_snake_case_fields(self):
        """Should handle both camelCase and snake_case field names."""
        session_data = {
            "name": "sessions/test123",
            "display_name": "Test Session",  # snake_case
            "state": "STATE_ACTIVE",
            "create_time": "2025-12-31T10:00:00Z",  # snake_case
            "update_time": "2025-12-31T11:00:00Z",  # snake_case
        }
        
        session = upsert_session(session_data)
        
        assert session.display_name == "Test Session"
        assert session.create_time is not None
        assert session.update_time is not None


@pytest.mark.django_db
class TestDetectActivityType:
    """Tests for detect_activity_type function."""

    def test_detect_plan_generated(self):
        """Should detect planGenerated activity type."""
        activity_data = {"planGenerated": {"plan": "some plan"}}
        assert detect_activity_type(activity_data) == "planGenerated"

    def test_detect_plan_approved(self):
        """Should detect planApproved activity type."""
        activity_data = {"planApproved": {"approved": True}}
        assert detect_activity_type(activity_data) == "planApproved"

    def test_detect_progress_updated(self):
        """Should detect progressUpdated activity type."""
        activity_data = {"progressUpdated": {"progress": 50}}
        assert detect_activity_type(activity_data) == "progressUpdated"

    def test_detect_session_completed(self):
        """Should detect sessionCompleted activity type."""
        activity_data = {"sessionCompleted": {"status": "success"}}
        assert detect_activity_type(activity_data) == "sessionCompleted"

    def test_empty_dict_not_detected(self):
        """Should not detect activity type for empty dict values."""
        activity_data = {"planGenerated": {}}
        assert detect_activity_type(activity_data) == ""

    def test_none_value_not_detected(self):
        """Should not detect activity type for None values."""
        activity_data = {"planGenerated": None}
        assert detect_activity_type(activity_data) == ""

    def test_false_value_not_detected(self):
        """Should not detect activity type for False values."""
        activity_data = {"planApproved": False}
        assert detect_activity_type(activity_data) == ""

    def test_no_matching_keys(self):
        """Should return empty string when no matching keys found."""
        activity_data = {"someOtherKey": "value"}
        assert detect_activity_type(activity_data) == ""

    def test_priority_order(self):
        """Should return first matching key in priority order."""
        activity_data = {
            "planGenerated": {"plan": "some plan"},
            "planApproved": {"approved": True},
        }
        assert detect_activity_type(activity_data) == "planGenerated"


@pytest.mark.django_db
class TestUpsertActivities:
    """Tests for upsert_activities function."""

    def test_create_activities(self):
        """Should create activities for a session."""
        session = JulesSession.objects.create(
            name="sessions/test123",
            display_name="Test Session",
            state="STATE_ACTIVE",
        )
        
        activities = [
            {
                "name": "activities/act1",
                "planGenerated": {"plan": "test"},
                "createTime": "2025-12-31T10:00:00Z",
            },
            {
                "name": "activities/act2",
                "planApproved": {"approved": True},
                "createTime": "2025-12-31T11:00:00Z",
            },
        ]
        
        upsert_activities(session, activities)
        
        assert session.activities.count() == 2
        act1 = session.activities.get(name="activities/act1")
        assert act1.activity_type == "planGenerated"
        assert act1.create_time is not None
        
        act2 = session.activities.get(name="activities/act2")
        assert act2.activity_type == "planApproved"

    def test_update_existing_activities(self):
        """Should update existing activities when data changes."""
        session = JulesSession.objects.create(
            name="sessions/test123",
            display_name="Test Session",
            state="STATE_ACTIVE",
        )
        
        JulesActivity.objects.create(
            session=session,
            name="activities/act1",
            activity_type="planGenerated",
            payload={"old": "data"},
        )
        
        activities = [
            {
                "name": "activities/act1",
                "planApproved": {"approved": True},
                "createTime": "2025-12-31T10:00:00Z",
            },
        ]
        
        upsert_activities(session, activities)
        
        assert session.activities.count() == 1
        act = session.activities.get(name="activities/act1")
        assert act.activity_type == "planApproved"
        assert act.payload == activities[0]

    def test_handle_snake_case_fields(self):
        """Should handle both camelCase and snake_case field names."""
        session = JulesSession.objects.create(
            name="sessions/test123",
            display_name="Test Session",
            state="STATE_ACTIVE",
        )
        
        activities = [
            {
                "name": "activities/act1",
                "planGenerated": {"plan": "test"},
                "create_time": "2025-12-31T10:00:00Z",  # snake_case
            },
        ]
        
        upsert_activities(session, activities)
        
        act = session.activities.get(name="activities/act1")
        assert act.create_time is not None

    def test_empty_activities_list(self):
        """Should handle empty activities list gracefully."""
        session = JulesSession.objects.create(
            name="sessions/test123",
            display_name="Test Session",
            state="STATE_ACTIVE",
        )
        
        upsert_activities(session, [])
        
        assert session.activities.count() == 0
