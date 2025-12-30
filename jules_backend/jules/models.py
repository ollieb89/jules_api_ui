from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken

def get_fernet_key():
    """Derive a URL-safe base64-encoded 32-byte key from Django SECRET_KEY using PBKDF2-HMAC-SHA256."""
    # Use PBKDF2-HMAC-SHA256 with a fixed salt and high iteration count to derive a 32-byte key
    salt = b"jules_backend.jules.models.get_fernet_key"
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        settings.SECRET_KEY.encode(),
        salt,
        260000,
        dklen=32,
    )
    # Base64 encode it to make it URL-safe, required by Fernet
    return base64.urlsafe_b64encode(derived_key)

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
            key = get_fernet_key()
            f = Fernet(key)
            encrypted = f.encrypt(api_key.encode()).decode()
            self._encrypted_api_key = encrypted
        except Exception as e:
            raise ValidationError(f"Failed to encrypt API key: {e}")
    
    def get_api_key(self) -> str | None:
        """Decrypt and return API key (supports legacy base64 fallback)."""
        if not self._encrypted_api_key:
            return None
        
        try:
            key = get_fernet_key()
            f = Fernet(key)
            decrypted = f.decrypt(self._encrypted_api_key.encode()).decode()
            return decrypted
        except InvalidToken:
            # Fallback for legacy Base64 encoded keys
            try:
                decoded = base64.b64decode(self._encrypted_api_key.encode()).decode()
                # Optionally migrate to new encryption on read?
                # Better to do it explicitly or on next save.
                # For now, just return the decoded value.
                return decoded
            except Exception as e:
                # If it's neither valid Fernet nor valid Base64, re-raise or fail
                raise ValidationError(f"Failed to decode legacy Base64 API key: {e}")
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
