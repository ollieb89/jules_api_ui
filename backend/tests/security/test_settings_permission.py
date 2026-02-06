import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

User = get_user_model()

@pytest.fixture
def regular_client(db):
    user = User.objects.create_user(
        username='regular_user',
        password='password',
        is_staff=False
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def admin_client(db):
    user = User.objects.create_user(
        username='admin_user',
        password='password',
        is_staff=True
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_regular_user_can_update_api_key(regular_client):
    """
    Demonstrate vulnerability: Regular user CAN update API key currently.
    This test is expected to PASS before the fix, and FAIL (or be updated) after the fix.
    """
    payload = {"api_key": "new-malicious-key"}
    response = regular_client.post('/api/jules/settings/api-key/', payload, format='json')

    # CURRENT BEHAVIOR: 200 OK (Vulnerability)
    # EXPECTED BEHAVIOR AFTER FIX: 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() != "new-malicious-key"

def test_admin_user_can_update_api_key(admin_client):
    """Admin user should always be able to update API key."""
    payload = {"api_key": "admin-secure-key"}
    response = admin_client.post('/api/jules/settings/api-key/', payload, format='json')

    assert response.status_code == status.HTTP_200_OK

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == "admin-secure-key"
