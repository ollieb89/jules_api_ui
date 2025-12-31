
import pytest
import base64
from unittest.mock import patch, Mock
from django.conf import settings
from django.core.exceptions import ValidationError
from cryptography.fernet import Fernet
from jules.models import JulesSettings, get_fernet_key

@pytest.mark.django_db
class TestJulesSettingsEncryption:

    def test_set_api_key_encrypts_data(self):
        """Test that set_api_key properly encrypts the data using Fernet."""
        settings_obj, _ = JulesSettings.objects.get_or_create(pk=1)
        api_key = "test-api-key-123"

        settings_obj.set_api_key(api_key)
        settings_obj.save()

        # Verify raw storage is encrypted (starts with Fernet header gAAAAA)
        settings_obj.refresh_from_db()
        raw_value = settings_obj._encrypted_api_key
        assert raw_value.startswith("gAAAAA")
        assert raw_value != api_key
        assert raw_value != base64.b64encode(api_key.encode()).decode()

    def test_get_api_key_decrypts_data(self):
        """Test that get_api_key successfully decrypts the data."""
        settings_obj, _ = JulesSettings.objects.get_or_create(pk=1)
        api_key = "test-api-key-456"

        settings_obj.set_api_key(api_key)
        settings_obj.save()

        decrypted_key = settings_obj.get_api_key()
        assert decrypted_key == api_key

    def test_legacy_base64_fallback(self):
        """Test that get_api_key falls back to base64 decoding for legacy keys."""
        settings_obj, _ = JulesSettings.objects.get_or_create(pk=1)
        legacy_key = "legacy-key-789"

        # Manually store as base64
        encoded_legacy = base64.b64encode(legacy_key.encode()).decode()
        JulesSettings.objects.filter(pk=1).update(_encrypted_api_key=encoded_legacy)

        settings_obj.refresh_from_db()
        retrieved_key = settings_obj.get_api_key()

        assert retrieved_key == legacy_key

    def test_key_derivation_consistency(self):
        """Test that the derived key is consistent for the same SECRET_KEY."""
        key1 = get_fernet_key()
        key2 = get_fernet_key()
        assert key1 == key2

        # Ensure it is a valid base64url encoded 32-byte key
        decoded = base64.urlsafe_b64decode(key1)
        assert len(decoded) == 32

    def test_invalid_data_handling(self):
        """Test handling of data that is neither valid Fernet nor valid Base64."""
        settings_obj, _ = JulesSettings.objects.get_or_create(pk=1)

        # Store garbage data
        JulesSettings.objects.filter(pk=1).update(_encrypted_api_key="garbage-data")
        settings_obj.refresh_from_db()

        with pytest.raises(ValidationError, match="Failed to decode legacy Base64 API key"):
            settings_obj.get_api_key()
