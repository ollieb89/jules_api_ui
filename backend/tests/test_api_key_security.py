from rest_framework.exceptions import ValidationError
from jules.serializers import ApiKeyUpdateSerializer
import pytest

def test_api_key_length_validation():
    """Verify that API keys longer than 2048 characters are rejected."""
    long_key = "a" * 2049
    serializer = ApiKeyUpdateSerializer(data={"api_key": long_key})

    assert not serializer.is_valid()
    assert "api_key" in serializer.errors
    assert "API key cannot exceed 2048 characters." in str(serializer.errors["api_key"])

def test_valid_api_key():
    """Verify that a valid API key is accepted."""
    valid_key = "valid_api_key"
    serializer = ApiKeyUpdateSerializer(data={"api_key": valid_key})

    assert serializer.is_valid()
    assert serializer.validated_data["api_key"] == valid_key
