import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='tester', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_api_key_exceeds_length_limit(api_client):
    """
    Test that an API key exceeding 2048 characters is rejected.
    This protects against DoS via large payload encryption/storage.
    """
    # Create a large API key (2049 chars)
    large_api_key = "a" * 2049

    response = api_client.post(
        '/api/jules/settings/api-key/',
        {'api_key': large_api_key},
        format='json'
    )

    # This should now FAIL with 400 Bad Request due to max_length=2048
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Verify the error message
    payload = response.json()
    # DRF returns validation errors as field dicts
    assert 'api_key' in payload
    assert "at most 2048 characters" in str(payload['api_key'])
