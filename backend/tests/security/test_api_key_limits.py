import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    # Create a user to authenticate
    user = user_model.objects.create_user(username='tester', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
def test_update_api_key_rejects_very_long_input(api_client):
    """
    Test that the API correctly rejects an overly long API key (security fix).
    This test expects a 400 Bad Request to confirm the limit is enforced.
    """
    # Create a 5000 character string
    long_key = "a" * 5000

    response = api_client.post(
        '/api/jules/settings/api-key/',
        {'api_key': long_key},
        format='json'
    )

    # Assert it rejects it (FIX VERIFIED if this passes)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "API key must be at most 2048 characters." in str(response.data)
