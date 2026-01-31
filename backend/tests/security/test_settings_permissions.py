import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from jules.models import JulesSettings

@pytest.fixture
def regular_user(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='regular', password='pass', is_staff=False)
    return user

@pytest.fixture
def admin_user(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='admin', password='pass', is_staff=True)
    return user

@pytest.mark.django_db
def test_regular_user_cannot_update_api_key(regular_user):
    client = APIClient()
    client.force_authenticate(user=regular_user)

    # Try to update API key
    response = client.post('/api/jules/settings/api-key/', {'api_key': 'new-key'}, format='json')

    # EXPECTATION: Should be 403 Forbidden
    # REALITY (Suspected): 200 OK or 201 Created

    # If this assertion fails with 200, the vulnerability is confirmed.
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_admin_user_can_update_api_key(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)

    response = client.post('/api/jules/settings/api-key/', {'api_key': 'admin-key'}, format='json')

    assert response.status_code == status.HTTP_200_OK

    settings = JulesSettings.get_settings()
    assert settings.get_api_key() == 'admin-key'
