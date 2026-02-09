import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model


@pytest.fixture
def api_client():
    user = get_user_model().objects.create_user(
        username="regular_user", password="password"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_client():
    user = get_user_model().objects.create_superuser(
        username="admin_user", password="password"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_settings_list_forbidden_for_regular_user(api_client):
    """Regular users should not be able to view settings."""
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_settings_update_api_key_forbidden_for_regular_user(api_client):
    """Regular users should not be able to update API key."""
    response = api_client.post(
        "/api/jules/settings/api-key/", {"api_key": "new-key"}, format="json"
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_settings_test_connection_forbidden_for_regular_user(api_client):
    """Regular users should not be able to test connection."""
    response = api_client.post("/api/jules/settings/test/", format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_settings_allowed_for_admin(admin_client):
    """Admins should be able to view settings."""
    response = admin_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK
