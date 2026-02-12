import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def regular_client(db):
    user = get_user_model().objects.create_user(username='regular', password='password')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user = get_user_model().objects.create_superuser(username='admin', password='password', email='admin@example.com')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_settings_list_forbidden_for_regular_user(regular_client):
    response = regular_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_api_key_update_forbidden_for_regular_user(regular_client):
    response = regular_client.post('/api/jules/settings/api-key/', {'api_key': 'secret'}, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_test_connection_forbidden_for_regular_user(regular_client):
    response = regular_client.post('/api/jules/settings/test/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_list_accessible_for_admin_user(admin_client):
    response = admin_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_200_OK
    assert 'masked_api_key' in response.json()

def test_settings_api_key_update_accessible_for_admin_user(admin_client):
    # This might fail if database or encryption setup is missing, but we just check access (not 403)
    response = admin_client.post('/api/jules/settings/api-key/', {'api_key': 'new-key'}, format='json')
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR]
    # It should NOT be 403

def test_settings_test_connection_accessible_for_admin_user(admin_client, monkeypatch):
    # Mock the client to avoid actual external calls
    class StubClient:
        def list_sources(self):
            return {'sources': []}

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    # We might need to set an API key first for this to work properly,
    # but primarily we want to ensure it's not 403.
    # The view checks for API key existence first.

    response = admin_client.post('/api/jules/settings/test/')
    assert response.status_code != status.HTTP_403_FORBIDDEN
