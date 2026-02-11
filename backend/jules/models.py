import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def _derive_fernet_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


@lru_cache(maxsize=1)
def get_api_key_fernet():
    """
    Get Fernet instance using dedicated JULES_API_KEY_ENCRYPTION_KEY.
    Cached to avoid re-deriving key on every call.

    WARNING: The encryption key is derived from settings.JULES_API_KEY_ENCRYPTION_KEY.
    If JULES_API_KEY_ENCRYPTION_KEY is rotated, all encrypted API keys will become
    unreadable until re-encrypted.
    """
    if not settings.JULES_API_KEY_ENCRYPTION_KEY:
        raise ValidationError(
            "JULES_API_KEY_ENCRYPTION_KEY must be set to encrypt API keys."
        )

    return Fernet(_derive_fernet_key(settings.JULES_API_KEY_ENCRYPTION_KEY))


@lru_cache(maxsize=1)
def get_legacy_fernets() -> list[Fernet]:
    """Get legacy Fernet instances for fallback reads."""
    secrets: list[str] = []
    if settings.JULES_API_KEY_ENCRYPTION_KEY:
        secrets.append(settings.JULES_API_KEY_ENCRYPTION_KEY)
    if settings.SECRET_KEY and settings.SECRET_KEY not in secrets:
        secrets.append(settings.SECRET_KEY)

    fernets: list[Fernet] = []
    for secret in secrets:
        fernets.append(Fernet(_derive_fernet_key(secret)))
    return fernets


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
            f = get_api_key_fernet()
            encrypted = f.encrypt(api_key.encode()).decode()
            self._encrypted_api_key = encrypted
        except Exception as e:
            raise ValidationError("Failed to encrypt API key.") from e

    def get_api_key(self) -> str | None:
        """Decrypt and return API key."""
        if not self._encrypted_api_key:
            return None

        try:
            f = get_api_key_fernet()
            decrypted = f.decrypt(self._encrypted_api_key.encode()).decode()
            return decrypted
        except Exception:
            for legacy_fernet in get_legacy_fernets():
                try:
                    decrypted = legacy_fernet.decrypt(
                        self._encrypted_api_key.encode()
                    ).decode()
                    return decrypted
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


class JulesSession(models.Model):
    """Locally cached Jules session data."""

    name = models.CharField(max_length=255, unique=True)
    display_name = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=32, default="STATE_UNSPECIFIED", blank=True)
    prompt = models.TextField(blank=True)
    source = models.TextField(blank=True)
    create_time = models.DateTimeField(blank=True, null=True)
    update_time = models.DateTimeField(blank=True, null=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "jules_sessions"
        indexes = [
            models.Index(fields=["last_synced_at"]),
        ]

    def __str__(self) -> str:
        return self.display_name or self.name


class JulesActivity(models.Model):
    """Locally cached Jules activity data."""

    TYPE_PLAN_GENERATED = "plan_generated"
    TYPE_PLAN_APPROVED = "plan_approved"
    TYPE_PROGRESS_UPDATED = "progress_updated"
    TYPE_SESSION_COMPLETED = "session_completed"
    TYPE_UNKNOWN = "unknown"

    TYPE_CHOICES = [
        (TYPE_PLAN_GENERATED, "Plan Generated"),
        (TYPE_PLAN_APPROVED, "Plan Approved"),
        (TYPE_PROGRESS_UPDATED, "Progress Updated"),
        (TYPE_SESSION_COMPLETED, "Session Completed"),
        (TYPE_UNKNOWN, "Unknown"),
    ]

    session = models.ForeignKey(
        JulesSession,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    name = models.CharField(max_length=255, unique=True)
    activity_type = models.CharField(
        max_length=32,
        choices=TYPE_CHOICES,
        default=TYPE_UNKNOWN,
    )
    payload = models.JSONField(default=dict, blank=True)
    create_time = models.DateTimeField(blank=True, null=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "jules_activities"
        indexes = [
            models.Index(fields=["session", "create_time"]),
            models.Index(fields=["activity_type"]),
            models.Index(fields=["last_synced_at"]),
        ]

    def __str__(self) -> str:
        return self.name
