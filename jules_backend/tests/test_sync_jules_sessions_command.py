import pytest
from io import StringIO
from unittest.mock import MagicMock, patch
from django.core.management import call_command

from jules.models import JulesActivity, JulesSession


@pytest.mark.django_db
class TestSyncJulesSessionsCommand:
    """Test suite for sync_jules_sessions management command."""

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_syncs_sessions_and_activities_successfully(self, mock_client_class):
        """Test successful sync of sessions and activities."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock list_sessions response
        mock_client.list_sessions.return_value = {
            "sessions": [
                {
                    "name": "sessions/1",
                    "displayName": "Session 1",
                    "state": "STATE_ACTIVE",
                    "prompt": "Test prompt 1",
                    "source": "github.com/test/repo1",
                },
                {
                    "name": "sessions/2",
                    "displayName": "Session 2",
                    "state": "STATE_COMPLETED",
                    "prompt": "Test prompt 2",
                    "source": "github.com/test/repo2",
                },
            ],
            "nextPageToken": None,
        }

        # Mock list_activities response
        mock_client.list_activities.return_value = {
            "activities": [
                {
                    "name": "activities/1",
                    "planGenerated": {"plan": "test"},
                },
            ],
            "nextPageToken": None,
        }

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify sessions were created
        assert JulesSession.objects.count() == 2
        assert JulesSession.objects.filter(name="sessions/1").exists()
        assert JulesSession.objects.filter(name="sessions/2").exists()

        # Verify activities were created for both sessions
        assert JulesActivity.objects.count() == 2

        # Verify success message
        output = out.getvalue()
        assert "Synced 2 sessions and 2 activities" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handles_pagination_for_sessions(self, mock_client_class):
        """Test that command handles paginated session responses."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock paginated list_sessions responses
        mock_client.list_sessions.side_effect = [
            {
                "sessions": [
                    {"name": "sessions/1", "displayName": "Session 1", "state": "STATE_ACTIVE"},
                ],
                "nextPageToken": "page2",
            },
            {
                "sessions": [
                    {"name": "sessions/2", "displayName": "Session 2", "state": "STATE_ACTIVE"},
                ],
                "nextPageToken": None,
            },
        ]

        # Mock list_activities to return empty
        mock_client.list_activities.return_value = {"activities": [], "nextPageToken": None}

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify both pages were processed
        assert JulesSession.objects.count() == 2
        assert mock_client.list_sessions.call_count == 2

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handles_pagination_for_activities(self, mock_client_class):
        """Test that command handles paginated activity responses."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock list_sessions
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/1", "displayName": "Session 1", "state": "STATE_ACTIVE"},
            ],
            "nextPageToken": None,
        }

        # Mock paginated list_activities responses
        mock_client.list_activities.side_effect = [
            {
                "activities": [{"name": "activities/1", "planGenerated": {"plan": "test"}}],
                "nextPageToken": "actpage2",
            },
            {
                "activities": [{"name": "activities/2", "planApproved": {"approved": True}}],
                "nextPageToken": None,
            },
        ]

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify both activity pages were processed
        assert JulesActivity.objects.count() == 2
        assert mock_client.list_activities.call_count == 2

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_continues_on_session_sync_error(self, mock_client_class):
        """Test that command continues syncing when a single session fails."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock list_sessions with one good and one problematic session
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/1", "displayName": "Good Session", "state": "STATE_ACTIVE"},
                {"name": ""},  # Invalid session that will cause an error
            ],
            "nextPageToken": None,
        }

        # Mock list_activities
        mock_client.list_activities.return_value = {"activities": [], "nextPageToken": None}

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify the good session was still synced
        assert JulesSession.objects.count() == 1
        assert JulesSession.objects.filter(name="sessions/1").exists()

        # Verify warning was logged
        output = out.getvalue()
        assert "Failed to sync session" in output or "Synced 1 sessions" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_continues_on_activities_fetch_error(self, mock_client_class):
        """Test that command continues when fetching activities fails."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock list_sessions
        mock_client.list_sessions.return_value = {
            "sessions": [
                {"name": "sessions/1", "displayName": "Session 1", "state": "STATE_ACTIVE"},
            ],
            "nextPageToken": None,
        }

        # Mock list_activities to raise an error
        mock_client.list_activities.side_effect = Exception("API error")

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify session was still synced
        assert JulesSession.objects.count() == 1

        # Verify warning was logged
        output = out.getvalue()
        assert "Failed to fetch activities" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handles_list_sessions_error(self, mock_client_class):
        """Test that command handles error when listing sessions."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock list_sessions to raise an error
        mock_client.list_sessions.side_effect = Exception("Network error")

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        # Verify error was logged
        output = out.getvalue()
        assert "Failed to fetch sessions" in output

        # Verify no sessions were synced
        assert JulesSession.objects.count() == 0

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_respects_page_size_argument(self, mock_client_class):
        """Test that custom page size is passed to API calls."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock responses
        mock_client.list_sessions.return_value = {"sessions": [], "nextPageToken": None}
        mock_client.list_activities.return_value = {"activities": [], "nextPageToken": None}

        call_command("sync_jules_sessions", page_size=50)

        # Verify page_size was passed correctly
        mock_client.list_sessions.assert_called_with(page_size=50, page_token=None)

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_reports_zero_when_no_data(self, mock_client_class):
        """Test that command reports 0 synced when no data is available."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Mock empty responses
        mock_client.list_sessions.return_value = {"sessions": [], "nextPageToken": None}

        out = StringIO()
        call_command("sync_jules_sessions", stdout=out)

        output = out.getvalue()
        assert "Synced 0 sessions and 0 activities" in output

    @patch("jules.management.commands.sync_jules_sessions.JulesApiClient")
    def test_handles_client_initialization_error(self, mock_client_class):
        """Test that command handles error during client initialization."""
        mock_client_class.side_effect = Exception("Failed to initialize client")

        out = StringIO()
        with pytest.raises(Exception, match="Failed to initialize client"):
            call_command("sync_jules_sessions", stdout=out)
