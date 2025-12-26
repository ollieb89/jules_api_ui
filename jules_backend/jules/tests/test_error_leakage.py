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
    # We need to patch where it is used, which is jules.views.JulesApiClient
    with patch("jules.views.JulesApiClient") as mock_client_class:
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        yield mock_client

@pytest.mark.django_db
class TestErrorHandling:
    """Tests for error handling information leakage."""

    def test_source_list_error_leakage_prevention(self, api_client, mock_jules_client):
        """Test that detailed error messages are NOT leaked."""
        # Simulate an internal error with sensitive info
        sensitive_info = "Connection failed to database at 192.168.1.55:5432 user=admin password=secret"
        mock_jules_client.list_sources.side_effect = Exception(sensitive_info)

        url = reverse("source-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        # Secure behavior: the error message should NOT contain the sensitive info
        assert sensitive_info not in response.data["error"]
        assert response.data["error"] == "An unexpected error occurred. Please try again later."
