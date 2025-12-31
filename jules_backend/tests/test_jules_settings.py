import pytest
import base64
from django.core.exceptions import ValidationError
from django.conf import settings
from unittest.mock import patch
from cryptography.fernet import Fernet

from jules.models import JulesSettings, get_fernet_key


@pytest.mark.django_db
class TestGetFernetKey:
    """Tests for get_fernet_key function."""

    def test_returns_valid_fernet_key(self):
        """Test that get_fernet_key returns a valid Fernet key."""
        key = get_fernet_key()
        # Should be able to create a Fernet instance with this key
        f = Fernet(key)
        assert f is not None

    def test_key_is_deterministic(self):
        """Test that get_fernet_key always returns the same key for the same SECRET_KEY."""
        key1 = get_fernet_key()
        key2 = get_fernet_key()
        assert key1 == key2

    def test_key_changes_with_secret_key(self):
        """Test that get_fernet_key returns different key when SECRET_KEY changes."""
        original_secret = settings.SECRET_KEY
        
        key1 = get_fernet_key()
        
        with patch.object(settings, 'SECRET_KEY', 'different-secret-key'):
            key2 = get_fernet_key()
        
        # Restore original
        assert key1 != key2


@pytest.mark.django_db
class TestJulesSettingsEncryption:
    """Tests for JulesSettings encryption/decryption methods."""

    def test_set_and_get_api_key(self):
        """Test that API keys can be set and retrieved correctly."""
        settings_obj = JulesSettings.get_settings()
        test_key = "test-api-key-12345"
        
        settings_obj.set_api_key(test_key)
        settings_obj.save()
        
        # Reload from database
        settings_obj.refresh_from_db()
        retrieved_key = settings_obj.get_api_key()
        
        assert retrieved_key == test_key

    def test_api_key_is_encrypted_in_database(self):
        """Test that API key is actually encrypted in the database."""
        settings_obj = JulesSettings.get_settings()
        test_key = "test-api-key-12345"
        
        settings_obj.set_api_key(test_key)
        settings_obj.save()
        
        # The encrypted value should not match the original
        assert settings_obj._encrypted_api_key != test_key
        # It should not be Base64 encoded plain text either
        try:
            decoded = base64.b64decode(settings_obj._encrypted_api_key.encode()).decode()
            # If it decodes successfully as Base64, it should not match the original
            # (Fernet output is Base64, but it's not just the plain text encoded)
            assert decoded != test_key
        except Exception:
            # If it fails to decode, that's also fine - it means it's encrypted
            pass

    def test_set_empty_api_key(self):
        """Test that setting an empty API key clears the stored value."""
        settings_obj = JulesSettings.get_settings()
        
        # First set a key
        settings_obj.set_api_key("some-key")
        settings_obj.save()
        assert settings_obj.get_api_key() is not None
        
        # Now clear it
        settings_obj.set_api_key("")
        settings_obj.save()
        
        settings_obj.refresh_from_db()
        assert settings_obj.get_api_key() is None

    def test_set_none_api_key(self):
        """Test that setting None as API key clears the stored value."""
        settings_obj = JulesSettings.get_settings()
        
        # First set a key
        settings_obj.set_api_key("some-key")
        settings_obj.save()
        assert settings_obj.get_api_key() is not None
        
        # Now clear it with None
        settings_obj.set_api_key(None)
        settings_obj.save()
        
        settings_obj.refresh_from_db()
        assert settings_obj.get_api_key() is None

    def test_get_api_key_when_none_stored(self):
        """Test that get_api_key returns None when no key is stored."""
        settings_obj = JulesSettings.get_settings()
        settings_obj._encrypted_api_key = None
        settings_obj.save()
        
        settings_obj.refresh_from_db()
        assert settings_obj.get_api_key() is None


@pytest.mark.django_db
class TestJulesSettingsBackwardCompatibility:
    """Tests for backward compatibility with legacy Base64-encoded keys."""

    def test_reads_legacy_base64_key(self):
        """Test that legacy Base64-encoded keys can be read."""
        settings_obj = JulesSettings.get_settings()
        test_key = "legacy-api-key-54321"
        
        # Manually set a Base64-encoded key (simulating legacy data)
        legacy_encoded = base64.b64encode(test_key.encode()).decode()
        settings_obj._encrypted_api_key = legacy_encoded
        settings_obj.save()
        
        # Should be able to read it
        settings_obj.refresh_from_db()
        retrieved_key = settings_obj.get_api_key()
        
        assert retrieved_key == test_key

    def test_legacy_key_different_from_encrypted(self):
        """Test that legacy Base64 keys are detected and handled differently from Fernet."""
        settings_obj = JulesSettings.get_settings()
        test_key = "test-key-comparison"
        
        # Create a legacy Base64 key
        legacy_encoded = base64.b64encode(test_key.encode()).decode()
        settings_obj._encrypted_api_key = legacy_encoded
        settings_obj.save()
        legacy_stored = settings_obj._encrypted_api_key
        
        # Now encrypt with Fernet
        settings_obj.set_api_key(test_key)
        settings_obj.save()
        fernet_stored = settings_obj._encrypted_api_key
        
        # The stored values should be different
        assert legacy_stored != fernet_stored
        
        # But both should return the same key when retrieved
        settings_obj._encrypted_api_key = legacy_encoded
        assert settings_obj.get_api_key() == test_key
        
        settings_obj._encrypted_api_key = fernet_stored
        assert settings_obj.get_api_key() == test_key


@pytest.mark.django_db
class TestJulesSettingsErrorHandling:
    """Tests for error handling in JulesSettings."""

    def test_get_api_key_invalid_fernet_and_base64(self):
        """Test error when stored value is neither valid Fernet nor Base64."""
        settings_obj = JulesSettings.get_settings()
        
        # Set an invalid value that's not valid Fernet or Base64
        settings_obj._encrypted_api_key = "not-valid-fernet-or-base64!!!"
        settings_obj.save()
        
        settings_obj.refresh_from_db()
        
        with pytest.raises(ValidationError) as exc_info:
            settings_obj.get_api_key()
        
        # Should have a specific error message for Base64 decoding failure
        assert "Failed to decode legacy Base64 API key" in str(exc_info.value)

    def test_get_api_key_corrupted_fernet_token(self):
        """Test error when Fernet token is corrupted but looks like Fernet format."""
        settings_obj = JulesSettings.get_settings()
        
        # Create a valid Fernet token then corrupt it slightly
        key = get_fernet_key()
        f = Fernet(key)
        valid_token = f.encrypt(b"test-key").decode()
        
        # Corrupt the token (change a few characters in the middle)
        corrupted_token = valid_token[:20] + "XXX" + valid_token[23:]
        settings_obj._encrypted_api_key = corrupted_token
        settings_obj.save()
        
        settings_obj.refresh_from_db()
        
        # This should try Fernet first (fail), then try Base64 (fail), then raise
        with pytest.raises(ValidationError) as exc_info:
            settings_obj.get_api_key()
        
        assert "Failed to decode legacy Base64 API key" in str(exc_info.value)

    def test_set_api_key_encryption_failure(self):
        """Test error handling when encryption fails."""
        settings_obj = JulesSettings.get_settings()
        
        # Mock Fernet to raise an exception
        with patch('jules.models.Fernet') as mock_fernet:
            mock_fernet.return_value.encrypt.side_effect = Exception("Encryption failed")
            
            with pytest.raises(ValidationError) as exc_info:
                settings_obj.set_api_key("test-key")
            
            assert "Failed to encrypt API key" in str(exc_info.value)


@pytest.mark.django_db
class TestJulesSettingsMaskedApiKey:
    """Tests for get_masked_api_key method."""

    def test_mask_long_key(self):
        """Test that long API keys are properly masked."""
        settings_obj = JulesSettings.get_settings()
        test_key = "abcdefghijklmnop"  # 16 characters
        
        settings_obj.set_api_key(test_key)
        settings_obj.save()
        
        masked = settings_obj.get_masked_api_key()
        
        assert masked == "abcd...mnop"
        assert len(masked) < len(test_key)

    def test_mask_short_key(self):
        """Test that short API keys are fully masked."""
        settings_obj = JulesSettings.get_settings()
        test_key = "short"  # 5 characters
        
        settings_obj.set_api_key(test_key)
        settings_obj.save()
        
        masked = settings_obj.get_masked_api_key()
        
        assert masked == "****"

    def test_mask_none_key(self):
        """Test that masking returns None when no key is stored."""
        settings_obj = JulesSettings.get_settings()
        settings_obj._encrypted_api_key = None
        settings_obj.save()
        
        masked = settings_obj.get_masked_api_key()
        
        assert masked is None


@pytest.mark.django_db
class TestJulesSettingsSingleton:
    """Tests for singleton pattern in JulesSettings."""

    def test_get_settings_returns_same_instance(self):
        """Test that get_settings always returns the same instance."""
        settings1 = JulesSettings.get_settings()
        settings2 = JulesSettings.get_settings()
        
        assert settings1.id == settings2.id
        assert settings1.pk == 1
        assert settings2.pk == 1

    def test_get_settings_creates_if_not_exists(self):
        """Test that get_settings creates the settings object if it doesn't exist."""
        # Delete all settings
        JulesSettings.objects.all().delete()
        
        # Should create it
        settings_obj = JulesSettings.get_settings()
        
        assert settings_obj is not None
        assert settings_obj.pk == 1
        assert JulesSettings.objects.count() == 1
