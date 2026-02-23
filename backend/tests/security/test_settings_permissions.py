import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def regular_client(db):
    user_model = get_user_model()
    # Ensure username is unique if tests run in parallel or sequence with others
    user = user_model.objects.create_user(username="regular_security_tester", password="password")
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_regular_user_cannot_access_settings_list(regular_client):
    """Verify that a regular authenticated user cannot list settings."""
    response = regular_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_regular_user_cannot_update_api_key(regular_client):
    """Verify that a regular authenticated user cannot update the API key."""
    response = regular_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "hacked_key"},
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_regular_user_cannot_test_connection(regular_client):
    """Verify that a regular authenticated user cannot test the connection."""
    response = regular_client.post("/api/jules/settings/test/")
    assert response.status_code == status.HTTP_403_FORBIDDEN
