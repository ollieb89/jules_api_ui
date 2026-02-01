import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

@pytest.fixture
def regular_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='regular', password='password')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='admin', password='password', is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_settings_update_forbidden_for_regular_user(regular_client):
    """Ensure regular users cannot update the API key."""
    url = '/api/jules/settings/api-key/'
    data = {'api_key': 'new-secret-key'}
    response = regular_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_update_allowed_for_admin(admin_client):
    """Ensure admin users can update the API key."""
    url = '/api/jules/settings/api-key/'
    data = {'api_key': 'new-admin-key'}
    response = admin_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == 'new-admin-key'

def test_settings_list_forbidden_for_regular_user(regular_client):
    """Ensure regular users cannot view settings."""
    url = '/api/jules/settings/'
    response = regular_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
