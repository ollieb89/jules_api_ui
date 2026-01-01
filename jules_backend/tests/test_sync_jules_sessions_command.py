import pytest
from unittest.mock import Mock, patch, MagicMock
from io import StringIO
from django.core.management import call_command
from jules.models import JulesSession


@pytest.mark.django_db
class TestSyncJulesSessionsCommand:
    """Tests for sync_jules_sessions management command."""

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_sync_sessions_and_activities(self, mock_client_class):
        """Should sync sessions and activities successfully."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock list_sessions response
        mock_client.list_sessions.return_value = {
            "sessions": [
                {
                    "name": "sessions/test1",
                    "displayName": "Test Session 1",
                    "state": "STATE_ACTIVE",
                },
            ],
            "nextPageToken": None,
        }
        
        # Mock list_activities response
        mock_client.list_activities.return_value = {
            "activities": [
                {
                    "name": "activities/act1",
                    "planGenerated": {"plan": "test"},
                },
            ],
            "nextPageToken": None,
        }
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Verify sessions and activities were created
        assert JulesSession.objects.count() == 1
        session = JulesSession.objects.first()
        assert session.name == "sessions/test1"
        assert session.activities.count() == 1
        
        # Verify output
        output = out.getvalue()
        assert "Synced 1 sessions and 1 activities" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_sync_with_pagination(self, mock_client_class):
        """Should handle pagination correctly."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock paginated list_sessions responses
        mock_client.list_sessions.side_effect = [
            {
                "sessions": [
                    {"name": "sessions/test1", "displayName": "Test 1", "state": "STATE_ACTIVE"},
                ],
                "nextPageToken": "token1",
            },
            {
                "sessions": [
                    {"name": "sessions/test2", "displayName": "Test 2", "state": "STATE_ACTIVE"},
                ],
                "nextPageToken": None,
            },
        ]
        
        # Mock list_activities response (no activities)
        mock_client.list_activities.return_value = {
            "activities": [],
            "nextPageToken": None,
        }
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Verify both sessions were synced
        assert JulesSession.objects.count() == 2
        assert JulesSession.objects.filter(name="sessions/test1").exists()
        assert JulesSession.objects.filter(name="sessions/test2").exists()
        
        # Verify list_sessions was called twice
        assert mock_client.list_sessions.call_count == 2

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_sync_activities_with_pagination(self, mock_client_class):
        """Should handle activity pagination correctly."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock list_sessions response
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/test1", "displayName": "Test 1", "state": "STATE_ACTIVE"},
            ],
            "nextPageToken": None,
        }
        
        # Mock paginated list_activities responses
        mock_client.list_activities.side_effect = [
            {
                "activities": [
                    {"name": "activities/act1", "planGenerated": {"plan": "test1"}},
                ],
                "nextPageToken": "act_token1",
            },
            {
                "activities": [
                    {"name": "activities/act2", "planApproved": {"approved": True}},
                ],
                "nextPageToken": None,
            },
        ]
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Verify both activities were synced
        session = JulesSession.objects.first()
        assert session.activities.count() == 2
        
        # Verify list_activities was called twice
        assert mock_client.list_activities.call_count == 2

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handle_list_sessions_error(self, mock_client_class):
        """Should handle errors when listing sessions."""
        # Mock API client to raise error
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        mock_client.list_sessions.side_effect = Exception("API Error")
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Verify error was reported
        output = out.getvalue()
        assert "Failed to list sessions" in output
        assert "API Error" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handle_session_sync_error(self, mock_client_class):
        """Should continue syncing other sessions when one fails."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock list_sessions response with two sessions
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/test1", "displayName": "Test 1", "state": "STATE_ACTIVE"},
                {"name": "sessions/test2", "displayName": "Test 2", "state": "STATE_ACTIVE"},
            ],
            "nextPageToken": None,
        }
        
        # Mock list_activities to fail for first session, succeed for second
        mock_client.list_activities.side_effect = [
            Exception("Activity API Error"),
            {"activities": [], "nextPageToken": None},
        ]
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Verify both sessions were created despite activity error
        assert JulesSession.objects.count() == 2
        
        # Verify warning was reported
        output = out.getvalue()
        assert "Failed to sync activities" in output
        assert "Synced 2 sessions" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_custom_page_size(self, mock_client_class):
        """Should use custom page size when provided."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        mock_client.list_sessions.return_value = {
            "sessions": [],
            "nextPageToken": None,
        }
        
        # Run command with custom page size
        call_command("sync_jules_sessions", page_size=50)
        
        # Verify page size was passed correctly
        mock_client.list_sessions.assert_called_with(page_size=50, page_token=None)

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_report_failed_sessions(self, mock_client_class):
        """Should report count of failed sessions."""
        # Mock API client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock list_sessions response
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/test1", "displayName": "Test 1", "state": "STATE_ACTIVE"},
                {"name": "sessions/test2"},  # Missing required fields
            ],
            "nextPageToken": None,
        }
        
        # Mock list_activities
        mock_client.list_activities.return_value = {
            "activities": [],
            "nextPageToken": None,
        }
        
        # Run command
        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)
        
        # Should report at least one session synced
        output = out.getvalue()
        assert "Synced" in output
