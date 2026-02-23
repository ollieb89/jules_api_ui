import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def regular_user_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="regular_user", password="pass", email="regular@example.com"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def admin_user_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_superuser(
        username="admin_user", password="pass", email="admin@example.com"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_regular_user_cannot_update_api_key(regular_user_client):
    """
    Ensure regular users cannot update the global Jules API key.
    This protects against privilege escalation.
    """
    response = regular_user_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "malicious-key"},
        format="json",
    )
    # This currently returns 200 (VULNERABILITY), but we want 403
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_regular_user_cannot_view_settings(regular_user_client):
    """
    Ensure regular users cannot view sensitive settings.
    """
    response = regular_user_client.get("/api/jules/settings/")
    # This currently returns 200 (VULNERABILITY), but we want 403
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_admin_user_can_update_api_key(admin_user_client):
    """
    Ensure admin users CAN update the API key.
    """
    response = admin_user_client.post(
        "/api/jules/settings/api-key/",
        data={"api_key": "valid-admin-key"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK


def test_admin_user_can_view_settings(admin_user_client):
    """
    Ensure admin users CAN view settings.
    """
    response = admin_user_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK
