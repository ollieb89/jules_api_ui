import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings


@pytest.fixture
def regular_user_client(db):
    user_model = get_user_model()
    # Create a regular user (is_staff=False, is_superuser=False)
    user = user_model.objects.create_user(
        username="regular_joe", email="joe@example.com", password="password"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_user_client(db):
    user_model = get_user_model()
    # Create an admin user (is_staff=True)
    user = user_model.objects.create_user(
        username="admin_alice",
        email="alice@example.com",
        password="password",
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_regular_user_cannot_update_api_key(regular_user_client):
    """
    Verify that regular users cannot update the API key.
    """
    payload = {"api_key": "hacker-was-here"}
    response = regular_user_client.post(
        "/api/jules/settings/api-key/", payload, format="json"
    )

    # Assert that the update was FORBIDDEN
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Verify DB was NOT updated
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() != "hacker-was-here"


def test_admin_user_can_update_api_key(admin_user_client):
    """
    Verify that admin users CAN update the API key.
    """
    payload = {"api_key": "legit-admin-key"}
    response = admin_user_client.post(
        "/api/jules/settings/api-key/", payload, format="json"
    )

    # Assert that the update was SUCCESSFUL
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"

    # Verify DB WAS updated
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == "legit-admin-key"


def test_regular_user_cannot_test_connection(regular_user_client):
    """
    Verify that regular users cannot trigger the connection test (potential SSRF/DoS).
    """
    response = regular_user_client.post("/api/jules/settings/test/", {}, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_regular_user_cannot_list_settings(regular_user_client):
    """
    Verify that regular users cannot see settings (masked key).
    """
    response = regular_user_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_403_FORBIDDEN
