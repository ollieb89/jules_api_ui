import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def regular_user(db):
    user_model = get_user_model()
    # Create a user with is_staff=False
    user = user_model.objects.create_user(username='regular', password='password', is_staff=False)
    return user

@pytest.fixture
def admin_user(db):
    user_model = get_user_model()
    # Create a user with is_staff=True
    user = user_model.objects.create_user(username='admin', password='password', is_staff=True)
    return user

def test_settings_list_forbidden_for_regular_user(regular_user):
    client = APIClient()
    client.force_authenticate(user=regular_user)

    response = client.get('/api/jules/settings/')

    # This assertion fails (returns 200) confirming the vulnerability
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_update_forbidden_for_regular_user(regular_user):
    client = APIClient()
    client.force_authenticate(user=regular_user)

    # Use format='json' to avoid 415
    response = client.post('/api/jules/settings/api-key/', {'api_key': 'new-key'}, format='json')

    # This assertion fails (returns 200 presumably) confirming the vulnerability
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_settings_allowed_for_admin_user(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)

    response = client.get('/api/jules/settings/')

    # Admin should be allowed
    assert response.status_code == status.HTTP_200_OK
