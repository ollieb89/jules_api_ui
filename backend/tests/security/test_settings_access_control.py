import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def regular_client(db):
    user_model = get_user_model()
    # Ensure unique username
    try:
        user = user_model.objects.get(username='regular_user')
    except user_model.DoesNotExist:
        user = user_model.objects.create_user(username='regular_user', password='password')

    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user_model = get_user_model()
    try:
        user = user_model.objects.get(username='admin_user')
    except user_model.DoesNotExist:
        user = user_model.objects.create_user(
            username='admin_user',
            password='password',
            email='admin@example.com',
            is_staff=True
        )

    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
def test_settings_list_forbidden_for_regular_user(regular_client):
    response = regular_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_settings_update_forbidden_for_regular_user(regular_client):
    response = regular_client.post('/api/jules/settings/api-key/', {'api_key': 'secret'})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_settings_test_connection_forbidden_for_regular_user(regular_client):
    response = regular_client.post('/api/jules/settings/test/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_settings_accessible_for_admin_user(admin_client):
    response = admin_client.get('/api/jules/settings/')
    assert response.status_code == status.HTTP_200_OK
