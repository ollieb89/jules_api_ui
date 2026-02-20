import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from jules.models import JulesSettings

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def regular_user(db):
    return User.objects.create_user(username='regular_user', password='password', is_staff=False)

@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username='admin_user', password='password', is_staff=True)

@pytest.mark.django_db
def test_regular_user_cannot_access_settings(api_client, regular_user):
    """
    Test that a regular user CANNOT access sensitive settings endpoints.
    This test confirms the fix.
    """
    api_client.force_authenticate(user=regular_user)

    # Try to list settings
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Try to update API key
    response = api_client.post(
        "/api/jules/settings/api-key/",
        {"api_key": "vulnerable-key"},
        format="json"
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_admin_user_can_access_settings(api_client, admin_user):
    """
    Test that an admin user can access sensitive settings endpoints.
    """
    api_client.force_authenticate(user=admin_user)

    # Try to list settings
    response = api_client.get("/api/jules/settings/")
    assert response.status_code == status.HTTP_200_OK

    # Try to update API key
    response = api_client.post(
        "/api/jules/settings/api-key/",
        {"api_key": "admin-key"},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
