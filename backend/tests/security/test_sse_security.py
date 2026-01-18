import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from jules.views import SessionViewSet

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(username='testuser', password='password')

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.mark.django_db
def test_cached_session_events_invalid_poll_interval_400(authenticated_client):
    """
    Verify that passing an invalid poll_interval now returns a 400 Bad Request
    instead of 500 Internal Server Error.
    """
    response = authenticated_client.get(
        "/api/jules/sessions/cached-events/",
        {"poll_interval": "invalid"},
    )

    assert response.status_code == 400
    assert response.data["poll_interval"] == "Must be a valid number."
