
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    # Create a regular user (not staff/superuser)
    user = user_model.objects.create_user(username='regular_user', password='pass', is_staff=False, is_superuser=False)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user_model = get_user_model()
    # Create an admin user (is_staff=True)
    user = user_model.objects.create_user(username='admin_user', password='pass', is_staff=True, is_superuser=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_regular_user_cannot_update_api_key(api_client):
    """
    Test that a regular user CANNOT update the global API key.
    """
    new_key = "new-secret-api-key"
    response = api_client.post(
        '/api/jules/settings/api-key/',
        {'api_key': new_key},
        format='json'
    )

    # We expect 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_admin_user_can_update_api_key(admin_client):
    """
    Test that an admin user CAN update the global API key.
    """
    new_key = "admin-secret-api-key"
    response = admin_client.post(
        '/api/jules/settings/api-key/',
        {'api_key': new_key},
        format='json'
    )

    assert response.status_code == status.HTTP_200_OK
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == new_key
