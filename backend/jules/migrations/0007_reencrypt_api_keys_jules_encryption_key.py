from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import migrations


def _derive_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def _legacy_secrets(new_secret: str) -> list[str]:
    secrets: list[str] = []
    for secret in (settings.JULES_API_KEY_ENCRYPTION_KEY, settings.SECRET_KEY):
        if secret and secret != new_secret and secret not in secrets:
            secrets.append(secret)
    return secrets


def _reencrypt_value(value: str, legacy_fernets: list[Fernet], target: Fernet) -> str | None:
    if not value:
        return None

    for legacy_fernet in legacy_fernets:
        try:
            decrypted = legacy_fernet.decrypt(value.encode()).decode()
        except Exception:
            continue

        return target.encrypt(decrypted.encode()).decode()

    return None


def reencrypt_api_keys(apps, schema_editor):
    JulesSettings = apps.get_model("jules", "JulesSettings")

    new_secret = settings.JULES_ENCRYPTION_KEY
    if not new_secret:
        raise RuntimeError("JULES_ENCRYPTION_KEY must be set before running this migration.")

    legacy_secrets = _legacy_secrets(new_secret)
    if not legacy_secrets:
        return

    legacy_fernets = [Fernet(_derive_key(secret)) for secret in legacy_secrets]
    new_fernet = Fernet(_derive_key(new_secret))

    for config in JulesSettings.objects.exclude(_encrypted_api_key__isnull=True).exclude(
        _encrypted_api_key=""
    ):
        updated_value = _reencrypt_value(config._encrypted_api_key, legacy_fernets, new_fernet)
        if updated_value:
            config._encrypted_api_key = updated_value
            config.save(update_fields=["_encrypted_api_key"])


def reverse_reencrypt_api_keys(apps, schema_editor):
    JulesSettings = apps.get_model("jules", "JulesSettings")

    new_secret = settings.JULES_ENCRYPTION_KEY
    if not new_secret:
        raise RuntimeError("JULES_ENCRYPTION_KEY must be set before reversing this migration.")

    legacy_secrets = _legacy_secrets(new_secret)
    if not legacy_secrets:
        raise RuntimeError(
            "A legacy encryption secret must be set before reversing this migration."
        )

    old_secret = legacy_secrets[0]
    old_fernet = Fernet(_derive_key(old_secret))
    new_fernet = Fernet(_derive_key(new_secret))

    for config in JulesSettings.objects.exclude(_encrypted_api_key__isnull=True).exclude(
        _encrypted_api_key=""
    ):
        updated_value = _reencrypt_value(config._encrypted_api_key, [new_fernet], old_fernet)
        if updated_value:
            config._encrypted_api_key = updated_value
            config.save(update_fields=["_encrypted_api_key"])


class Migration(migrations.Migration):
    dependencies = [
        ("jules", "0006_reencrypt_api_keys_dedicated_encryption_key"),
    ]

    operations = [
        migrations.RunPython(reencrypt_api_keys, reverse_reencrypt_api_keys),
    ]
