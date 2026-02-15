import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

@pytest.mark.django_db
def test_regular_user_cannot_update_api_key():
    # 1. Create a regular user
    user_model = get_user_model()
    user = user_model.objects.create_user(username='regular_joe', password='password123')

    # 2. Authenticate as regular user
    client = APIClient()
    client.force_authenticate(user=user)

    # 3. Try to update the API key
    new_key = "hacker-key-123"
    response = client.post('/api/jules/settings/api-key/', {'api_key': new_key}, format='json')

    # 4. Verify it failed (FIXED!)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Verify the key was NOT changed (assuming default or previous value)
    settings = JulesSettings.get_settings()
    # The key should not match the one we tried to set
    assert settings.get_api_key() != new_key

@pytest.mark.django_db
def test_admin_user_can_update_api_key():
    # 1. Create an admin user
    user_model = get_user_model()
    admin = user_model.objects.create_superuser(username='admin_jane', password='password123', email='admin@example.com')

    # 2. Authenticate as admin
    client = APIClient()
    client.force_authenticate(user=admin)

    # 3. Try to update the API key
    new_key = "admin-key-456"
    response = client.post('/api/jules/settings/api-key/', {'api_key': new_key}, format='json')

    # 4. Verify it succeeded
    assert response.status_code == status.HTTP_200_OK

    # Verify the key WAS changed
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == new_key
