from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken


def get_cipher_suite():
    """Derive a Fernet key from the Django SECRET_KEY."""
    # SHA256 the secret key to get 32 bytes
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    # Base64 encode it for Fernet
    return Fernet(base64.urlsafe_b64encode(key))


class JulesSettings(models.Model):
    """Settings for Jules API configuration."""

    # Singleton pattern - only one settings instance
    id = models.AutoField(primary_key=True)

    # Encrypted API key
    _encrypted_api_key = models.TextField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Jules Settings"
        verbose_name_plural = "Jules Settings"
        db_table = "jules_settings"

    def __str__(self):
        return "Jules Settings"

    def set_api_key(self, api_key: str) -> None:
        """Store API key encrypted with Fernet."""
        if not api_key:
            self._encrypted_api_key = None
            return

        try:
            cipher = get_cipher_suite()
            self._encrypted_api_key = cipher.encrypt(api_key.encode()).decode()
        except Exception as e:
            raise ValidationError(f"Failed to encrypt API key: {e}")

    def get_api_key(self) -> str | None:
        """Decrypt and return API key."""
        if not self._encrypted_api_key:
            return None

        try:
            cipher = get_cipher_suite()
            return cipher.decrypt(self._encrypted_api_key.encode()).decode()
        except (InvalidToken, ValueError):
            # Fallback for legacy base64 encoded keys
            # InvalidToken is raised by Fernet if decryption fails
            # ValueError might be raised if encoding is messed up
            try:
                return base64.b64decode(self._encrypted_api_key.encode()).decode()
            except Exception as e:
                raise ValidationError(f"Failed to decrypt API key: {e}")

    def get_masked_api_key(self) -> str | None:
        """Return masked version of API key for display."""
        api_key = self.get_api_key()
        if not api_key:
            return None

        if len(api_key) <= 8:
            return "****"

        return f"{api_key[:4]}...{api_key[-4:]}"

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings
