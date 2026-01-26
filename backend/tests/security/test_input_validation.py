import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model


@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    # Create user if not exists
    user, _ = user_model.objects.get_or_create(
        username="tester", defaults={"password": "pass"}
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_api_key_update_rejects_excessive_length(api_client):
    """
    Test that the API key update endpoint rejects keys that are too long.
    This prevents Denial of Service (DoS) attacks via memory exhaustion.
    """
    # Create a massive string (e.g. 50KB)
    massive_key = "x" * 50000

    response = api_client.post(
        "/api/jules/settings/api-key/", data={"api_key": massive_key}, format="json"
    )

    # Expect 400 Bad Request
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Check for specific error if possible, but 400 is the main goal
    # DRF standard error format for field validation is usually {'field': ['error']}
    # or exception handler might wrap it.
    # Based on utils.drf_exception_handler, standard 400s might go through default handler
    # which returns {'api_key': ['...']}
    # or wrapped if it raises ApiRequestError (but ValidationErrors are usually standard).

    # Let's inspect the payload in failure message if assertion fails
