import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username="regular", password="password", email="regular@example.com"
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin", password="password", email="admin@example.com", is_staff=True
    )


@pytest.mark.django_db
def test_regular_user_cannot_access_settings(api_client, regular_user):
    """
    Verify that a regular user CANNOT access sensitive settings endpoints.
    """
    api_client.force_authenticate(user=regular_user)

    # 1. List settings
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # 2. Update API key (sensitive!)
    response = api_client.post("/api/jules/settings/api-key/", {"api_key": "new-key"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # 3. Test connection
    response = api_client.post("/api/jules/settings/test/")
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_user_can_access_settings(api_client, admin_user):
    """
    Verify that an admin user CAN access settings endpoints.
    """
    api_client.force_authenticate(user=admin_user)

    # 1. List settings
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK

    # 2. Update API key
    response = api_client.post("/api/jules/settings/api-key/", {"api_key": "new-key"})
    assert response.status_code != status.HTTP_403_FORBIDDEN

    # 3. Test connection
    response = api_client.post("/api/jules/settings/test/")
    assert response.status_code != status.HTTP_403_FORBIDDEN
