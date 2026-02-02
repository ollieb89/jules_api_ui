import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_regular_user_cannot_access_settings():
    """
    SECURITY TEST:
    Verifies that a regular (non-admin) user CANNOT access settings endpoints.
    """
    # 1. Create a regular user
    user = User.objects.create_user(username="regular_user", password="password")

    # 2. Authenticate
    client = APIClient()
    client.force_authenticate(user=user)

    # 3. Try to access settings list
    response = client.get("/api/jules/settings/")

    # 4. Assert Forbidden (403)
    # If the vulnerability exists, this will likely be 200 OK
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_regular_user_cannot_update_api_key():
    """
    SECURITY TEST:
    Verifies that a regular (non-admin) user CANNOT update the API key.
    """
    # 1. Create a regular user
    user = User.objects.create_user(username="regular_user", password="password")

    # 2. Authenticate
    client = APIClient()
    client.force_authenticate(user=user)

    # 3. Try to update API key
    payload = {"api_key": "new_fake_key"}
    response = client.post("/api/jules/settings/api-key/", payload, format='json')

    # 4. Assert Forbidden (403)
    # If the vulnerability exists, this will likely be 200 OK
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_admin_can_access_settings():
    """
    Verifies that an admin user CAN access settings.
    """
    # 1. Create an admin user
    admin_user = User.objects.create_superuser(username="admin", password="password", email="admin@example.com")

    # 2. Authenticate
    client = APIClient()
    client.force_authenticate(user=admin_user)

    # 3. Access settings list
    response = client.get("/api/jules/settings/")

    # 4. Assert Success
    assert response.status_code == status.HTTP_200_OK
