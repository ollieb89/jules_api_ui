import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

@pytest.fixture
def regular_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='regular_user', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='admin_user', password='pass', is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_regular_user_forbidden_access_settings(regular_client):
    response = regular_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_regular_user_forbidden_update_api_key(regular_client):
    response = regular_client.post('/api/jules/settings/api-key/', {'api_key': 'malicious-key'}, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_admin_user_can_access_settings(admin_client):
    response = admin_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_200_OK

def test_admin_user_can_update_api_key(admin_client):
    response = admin_client.post('/api/jules/settings/api-key/', {'api_key': 'safe-key'}, format='json')
    assert response.status_code == status.HTTP_200_OK

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == 'safe-key'
