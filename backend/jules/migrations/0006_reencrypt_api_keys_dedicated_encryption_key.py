from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import migrations


def _derive_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def _reencrypt_value(value: str, source: Fernet, target: Fernet) -> str | None:
    if not value:
        return None

    try:
        decrypted = source.decrypt(value.encode()).decode()
    except Exception:
        return None

    return target.encrypt(decrypted.encode()).decode()


def reencrypt_api_keys(apps, schema_editor):
    JulesSettings = apps.get_model("jules", "JulesSettings")

    new_secret = settings.JULES_ENCRYPTION_KEY
    if not new_secret:
        raise RuntimeError("JULES_ENCRYPTION_KEY must be set before running this migration.")

    old_secret = settings.SECRET_KEY
    if not old_secret:
        raise RuntimeError("SECRET_KEY must be set before running this migration.")

    if new_secret == old_secret:
        return

    old_fernet = Fernet(_derive_key(old_secret))
    new_fernet = Fernet(_derive_key(new_secret))

    for config in JulesSettings.objects.exclude(_encrypted_api_key__isnull=True).exclude(
        _encrypted_api_key=""
    ):
        updated_value = _reencrypt_value(config._encrypted_api_key, old_fernet, new_fernet)
        if updated_value:
            config._encrypted_api_key = updated_value
            config.save(update_fields=["_encrypted_api_key"])


def reverse_reencrypt_api_keys(apps, schema_editor):
    JulesSettings = apps.get_model("jules", "JulesSettings")

    new_secret = settings.JULES_ENCRYPTION_KEY
    if not new_secret:
        raise RuntimeError("JULES_ENCRYPTION_KEY must be set before reversing this migration.")

    old_secret = settings.SECRET_KEY
    if not old_secret:
        raise RuntimeError("SECRET_KEY must be set before reversing this migration.")

    if new_secret == old_secret:
        return

    old_fernet = Fernet(_derive_key(old_secret))
    new_fernet = Fernet(_derive_key(new_secret))

    for config in JulesSettings.objects.exclude(_encrypted_api_key__isnull=True).exclude(
        _encrypted_api_key=""
    ):
        updated_value = _reencrypt_value(config._encrypted_api_key, new_fernet, old_fernet)
        if updated_value:
            config._encrypted_api_key = updated_value
            config.save(update_fields=["_encrypted_api_key"])


class Migration(migrations.Migration):
    dependencies = [
        ("jules", "0005_reencrypt_api_keys_jules_encryption_key"),
    ]

    operations = [
        migrations.RunPython(reencrypt_api_keys, reverse_reencrypt_api_keys),
    ]
