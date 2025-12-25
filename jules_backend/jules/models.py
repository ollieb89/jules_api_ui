from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import base64
import hashlib
from cryptography.fernet import Fernet


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
    
    def _get_fernet(self):
        """Get Fernet instance using SECRET_KEY."""
        # Ensure SECRET_KEY is adequate length (32 bytes url-safe base64-encoded)
        # If not, we hash it to get 32 bytes and then base64 encode
        key = settings.SECRET_KEY.encode()
        key = hashlib.sha256(key).digest()
        key = base64.urlsafe_b64encode(key)
        return Fernet(key)

    def set_api_key(self, api_key: str) -> None:
        """Store API key encrypted with Fernet."""
        if not api_key:
            self._encrypted_api_key = None
            return
        
        try:
            f = self._get_fernet()
            encrypted = f.encrypt(api_key.encode()).decode()
            self._encrypted_api_key = encrypted
        except Exception as e:
            raise ValidationError(f"Failed to encrypt API key: {e}")
    
    def get_api_key(self) -> str | None:
        """Decrypt and return API key, handling legacy base64."""
        if not self._encrypted_api_key:
            return None
        
        try:
            # Try Fernet decryption first
            f = self._get_fernet()
            return f.decrypt(self._encrypted_api_key.encode()).decode()
        except Exception:
            # Fallback to legacy base64
            try:
                decoded = base64.b64decode(self._encrypted_api_key.encode()).decode()
                # Auto-upgrade to Fernet
                self.set_api_key(decoded)
                self.save(update_fields=["_encrypted_api_key"])
                return decoded
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

