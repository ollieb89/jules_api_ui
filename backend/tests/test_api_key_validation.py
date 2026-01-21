import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from jules.serializers import ApiKeyUpdateSerializer
from jules.models import JulesSettings

def test_api_key_serializer_length_check():
    """
    Test that the serializer accepts/rejects keys based on length.
    """
    long_key = "a" * 5000
    serializer = ApiKeyUpdateSerializer(data={"api_key": long_key})

    assert not serializer.is_valid(), "Serializer should reject keys longer than 2048 chars"
    assert "at most 2048 characters" in str(serializer.errors["api_key"][0])

@pytest.mark.django_db
def test_update_api_key_endpoint_with_long_key():
    """
    Test the endpoint behavior with a long key.
    """
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="password")
    client.force_authenticate(user=user)

    long_key = "a" * 5000
    response = client.post("/api/jules/settings/api-key/", {"api_key": long_key}, format="json")

    # Expect 400 Bad Request
    assert response.status_code == 400

    # Check response structure. Standard DRF ValidationError returns {field: [errors]}
    # It might be wrapped if there's custom middleware or exception handling I missed,
    # but based on drf_exception_handler in jules/utils.py, it seems standard.
    assert "api_key" in response.data
    assert "at most 2048 characters" in str(response.data["api_key"][0])

    # Verify DB was NOT updated
    settings = JulesSettings.get_settings()
    assert settings.get_api_key() != long_key
