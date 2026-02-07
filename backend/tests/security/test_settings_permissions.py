import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def regular_user_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='regular_user', password='password', is_staff=False)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_user_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='admin_user', password='password', is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_settings_list_forbidden_for_regular_user(regular_user_client):
    response = regular_user_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_update_api_key_forbidden_for_regular_user(regular_user_client):
    response = regular_user_client.post('/api/jules/settings/api-key/', {'api_key': 'new-key'}, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_test_connection_forbidden_for_regular_user(regular_user_client):
    response = regular_user_client.post('/api/jules/settings/test/', format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_list_allowed_for_admin_user(admin_user_client):
    response = admin_user_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_200_OK
