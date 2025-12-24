import pytest
from unittest.mock import Mock, patch
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def mock_jules_client():
    """Mock JulesApiClient for testing."""
    # We patch at jules.views because that's where it is imported in the views module.
    with patch("jules.views.JulesApiClient") as mock_client_class:
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        yield mock_client


@pytest.mark.django_db
class TestSourceViewSet:
    """Tests for SourceViewSet."""

    def test_list_sources(self, api_client, mock_jules_client):
        """Test listing sources."""
        mock_jules_client.list_sources.return_value = {
            "sources": [
                {
                    "name": "sources/test-repo",
                    "displayName": "Test Repo",
                    "githubMetadata": {
                        "repository": "owner/repo",
                        "branch": "main",
                    },
                }
            ]
        }

        url = reverse("source-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "sources" in response.data
        assert len(response.data["sources"]) == 1


@pytest.mark.django_db
class TestSessionViewSet:
    """Tests for SessionViewSet."""

    def test_create_session(self, api_client, mock_jules_client):
        """Test creating a session."""
        mock_jules_client.create_session.return_value = {
            "name": "sessions/test-session",
            "displayName": "Test Session",
            "state": "ACTIVE",
            "prompt": "Test prompt",
            "source": "sources/test-repo",
            "createTime": "2024-01-01T00:00:00Z",
            "updateTime": "2024-01-01T00:00:00Z",
        }

        url = reverse("session-list")
        data = {"prompt": "Test prompt", "source": "sources/test-repo"}
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["display_name"] == "Test Session"

    def test_list_sessions(self, api_client, mock_jules_client):
        """Test listing sessions."""
        mock_jules_client.list_sessions.return_value = {
            "sessions": [
                {
                    "name": "sessions/test-session",
                    "displayName": "Test Session",
                    "state": "ACTIVE",
                    "prompt": "Test prompt",
                    "source": "sources/test-repo",
                    "createTime": "2024-01-01T00:00:00Z",
                    "updateTime": "2024-01-01T00:00:00Z",
                }
            ],
            "nextPageToken": None,
        }

        url = reverse("session-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "sessions" in response.data
        assert len(response.data["sessions"]) == 1

    def test_get_session(self, api_client, mock_jules_client):
        """Test getting a session."""
        mock_jules_client.get_session.return_value = {
            "name": "sessions/test-session",
            "displayName": "Test Session",
            "state": "ACTIVE",
            "prompt": "Test prompt",
            "source": "sources/test-repo",
            "createTime": "2024-01-01T00:00:00Z",
            "updateTime": "2024-01-01T00:00:00Z",
        }

        url = reverse("session-detail", kwargs={"pk": "test-session"})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["display_name"] == "Test Session"

    def test_delete_session(self, api_client, mock_jules_client):
        """Test deleting a session."""
        mock_jules_client.delete_session.return_value = None

        url = reverse("session-detail", kwargs={"pk": "test-session"})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_approve_plan(self, api_client, mock_jules_client):
        """Test approving a plan."""
        mock_jules_client.approve_plan.return_value = {
            "name": "sessions/test-session",
            "displayName": "Test Session",
            "state": "ACTIVE",
            "prompt": "Test prompt",
            "source": "sources/test-repo",
            "createTime": "2024-01-01T00:00:00Z",
            "updateTime": "2024-01-01T00:00:00Z",
        }

        url = reverse("session-approve-plan", kwargs={"pk": "test-session"})
        response = api_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_send_message(self, api_client, mock_jules_client):
        """Test sending a message."""
        mock_jules_client.send_message.return_value = {
            "name": "sessions/test-session",
            "displayName": "Test Session",
            "state": "ACTIVE",
            "prompt": "Test prompt",
            "source": "sources/test-repo",
            "createTime": "2024-01-01T00:00:00Z",
            "updateTime": "2024-01-01T00:00:00Z",
        }

        url = reverse("session-send-message", kwargs={"pk": "test-session"})
        data = {"message": "Test message"}
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_list_activities(self, api_client, mock_jules_client):
        """Test listing activities."""
        mock_jules_client.list_activities.return_value = {
            "activities": [
                {
                    "name": "activities/test-activity",
                    "planGenerated": {
                        "plan": {
                            "steps": [],
                            "state": "PENDING",
                        }
                    },
                    "createTime": "2024-01-01T00:00:00Z",
                }
            ],
            "nextPageToken": None,
        }

        url = reverse("session-activities", kwargs={"pk": "test-session"})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "activities" in response.data
        assert len(response.data["activities"]) == 1
