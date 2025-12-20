from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import base64
import hashlib


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
        """Store API key with simple encoding (base64)."""
        if not api_key:
            self._encrypted_api_key = None
            return
        
        try:
            # Simple base64 encoding (not encryption, but obfuscates in DB)
            # In production, use proper encryption with Fernet or similar
            encoded = base64.b64encode(api_key.encode()).decode()
            self._encrypted_api_key = encoded
        except Exception as e:
            raise ValidationError(f"Failed to encode API key: {e}")
    
    def get_api_key(self) -> str | None:
        """Decode and return API key."""
        if not self._encrypted_api_key:
            return None
        
        try:
            decoded = base64.b64decode(self._encrypted_api_key.encode()).decode()
            return decoded
        except Exception as e:
            raise ValidationError(f"Failed to decode API key: {e}")
    
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

