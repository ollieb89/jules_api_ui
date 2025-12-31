from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import base64
from cryptography.fernet import Fernet
import hashlib
from functools import lru_cache

@lru_cache(maxsize=1)
def get_fernet():
    """
    Get Fernet instance using JULES_ENCRYPTION_KEY.
    Cached to avoid re-deriving key on every call.

    WARNING: The encryption key is derived from settings.JULES_ENCRYPTION_KEY.
    If JULES_ENCRYPTION_KEY is rotated, all encrypted API keys will become unreadable
    until re-encrypted.
    """
    if not settings.JULES_ENCRYPTION_KEY:
        raise ValidationError("JULES_ENCRYPTION_KEY must be set to encrypt API keys.")

    # Ensure JULES_ENCRYPTION_KEY is 32 bytes for url-safe base64 encoding
    # We hash it to get 32 bytes, then base64 encode it to satisfy Fernet
    key = hashlib.sha256(settings.JULES_ENCRYPTION_KEY.encode()).digest()
    key_b64 = base64.urlsafe_b64encode(key)
    return Fernet(key_b64)

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
        """Store API key with Fernet encryption."""
        if not api_key:
            self._encrypted_api_key = None
            return
        
        try:
            f = get_fernet()
            encrypted = f.encrypt(api_key.encode()).decode()
            self._encrypted_api_key = encrypted
        except Exception as e:
            raise ValidationError(f"Failed to encrypt API key: {e}")
    
    def get_api_key(self) -> str | None:
        """Decrypt and return API key."""
        if not self._encrypted_api_key:
            return None
        
        try:
            f = get_fernet()
            # Try to decrypt assuming it's Fernet encrypted
            decrypted = f.decrypt(self._encrypted_api_key.encode()).decode()
            return decrypted
        except Exception:
            # Fallback for migration: check if it's the old base64 format
            try:
                # Basic base64 check - if it decodes and looks reasonable
                decoded = base64.b64decode(self._encrypted_api_key.encode()).decode()

                # If we successfully decoded, we should probably re-encrypt it properly
                # But we can't save here easily without triggering other things or needing self.save()
                # Ideally, we'd upgrade it. For now, let's just return it.
                # A proper migration script would be better, but this allows for lazy migration.
                return decoded
            except Exception:
                pass

            # If both fail
            raise ValidationError("Failed to decrypt API key")
    
    def get_masked_api_key(self) -> str | None:
        """Return masked version of API key for display."""
        try:
            api_key = self.get_api_key()
            if not api_key:
                return None

            if len(api_key) <= 8:
                return "****"

            return f"{api_key[:4]}...{api_key[-4:]}"
        except Exception:
            return None
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings
