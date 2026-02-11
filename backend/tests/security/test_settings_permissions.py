import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_regular_user_cannot_access_settings():
    """
    SECURITY TEST:
    Verifies that a regular user CANNOT access settings (API key).
    """
    user = User.objects.create_user(username="regular", password="password")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/jules/settings/")

    # We expect 403 Forbidden, but if the vulnerability exists, we'll get 200 OK.
    # This test will fail if the vulnerability exists, which is what we want to demonstrate.
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_regular_user_cannot_update_api_key():
    """
    SECURITY TEST:
    Verifies that a regular user CANNOT update the API key.
    """
    user = User.objects.create_user(username="regular", password="password")
    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"api_key": "new_key"}
    response = client.post("/api/jules/settings/api-key/", payload, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_can_access_settings():
    """
    Verifies that an admin user CAN access settings.
    """
    admin = User.objects.create_superuser(
        username="admin", password="password", email="admin@example.com"
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK
