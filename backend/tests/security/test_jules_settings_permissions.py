import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from jules.models import JulesSettings


@pytest.fixture
def regular_user(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username="regular", password="password")
    return user


@pytest.fixture
def admin_user(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="admin", password="password", is_staff=True
    )
    return user


@pytest.fixture
def api_client():
    return APIClient()


def test_regular_user_cannot_access_settings_list(api_client, regular_user):
    """
    Verify that a regular (non-staff) user cannot access the settings list endpoint.
    This endpoint reveals whether the API key is configured and its masked value.
    """
    api_client.force_authenticate(user=regular_user)
    response = api_client.get("/api/jules/settings/")

    # Expect 403 Forbidden because only admins should access settings
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_regular_user_cannot_update_api_key(api_client, regular_user):
    """
    Verify that a regular user cannot update the global API key.
    This is a critical security check to prevent privilege escalation.
    """
    api_client.force_authenticate(user=regular_user)
    response = api_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "hacked-key"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Verify key was not changed
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() != "hacked-key"


def test_regular_user_cannot_test_connection(api_client, regular_user):
    """
    Verify that a regular user cannot trigger the connection test.
    """
    api_client.force_authenticate(user=regular_user)
    response = api_client.post("/api/jules/settings/test/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_admin_user_can_access_settings(api_client, admin_user):
    """
    Verify that an admin user can access settings.
    """
    api_client.force_authenticate(user=admin_user)

    # 1. List
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK

    # 2. Update (mocking the encryption key if needed, but test environment should handle it)
    response = api_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "admin-key"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == "admin-key"
