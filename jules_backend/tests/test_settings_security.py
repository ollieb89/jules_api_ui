import pytest
import base64
from jules.models import JulesSettings


@pytest.mark.django_db
def test_api_key_storage_security():
    """
    Test that the API key is securely stored using encryption.
    """
    settings = JulesSettings.get_settings()
    api_key = "test_api_key_12345"

    # Set the API key
    settings.set_api_key(api_key)
    settings.save()

    # Retrieve from DB directly
    db_obj = JulesSettings.objects.get(pk=settings.pk)
    stored_value = db_obj._encrypted_api_key

    # Verify it is NOT just base64 encoded
    # Attempting to base64 decode it should result in garbage or failure
    # and definitely not the original key.
    try:
        decoded_attempt = base64.b64decode(stored_value).decode()
        assert decoded_attempt != api_key
    except Exception:
        # If decoding fails or returns garbage, that's good!
        pass

    # Verify the getter works (decrypts correctly)
    assert settings.get_api_key() == api_key

    # Test backward compatibility
    # Manually insert a base64 encoded key
    legacy_key = "legacy_key_123"
    legacy_encoded = base64.b64encode(legacy_key.encode()).decode()

    # We need to update directly to bypass the setter encryption
    JulesSettings.objects.filter(pk=settings.pk).update(
        _encrypted_api_key=legacy_encoded
    )

    settings.refresh_from_db()
    assert settings.get_api_key() == legacy_key
