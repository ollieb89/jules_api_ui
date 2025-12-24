# Sentinel's Journal

## 2024-05-22 - Insecure API Key Storage
**Vulnerability:** API Keys in `JulesSettings` are stored using Base64 encoding instead of encryption.
**Learning:** The codebase acknowledges this with a comment `# In production, use proper encryption`, but it presents a high risk if the database is compromised.
**Prevention:** Use `fernet` or similar field-level encryption libraries for sensitive data fields.

## 2024-05-22 - Mixed Framework Identity
**Vulnerability:** The project uses both FastAPI and Django, but `pixi.toml` and `manage.py` suggest a migration to Django. This leads to confusion on which dependencies are active and which security middleware is applied.
**Learning:** Legacy or transitional code can hide vulnerabilities if it's unclear what is actually running in production.
**Prevention:** Clearly deprecate and remove unused frameworks/routes. Ensure documentation (`AGENTS.md`) matches the active deployment configuration.

## 2025-05-27 - Base64 is Not Encryption
**Vulnerability:** Sensitive API keys were stored using `base64` encoding, which provides no security against database leaks.
**Learning:** Developers often confuse encoding/obfuscation with encryption. Even with a comment acknowledging the issue, it persists until explicitly fixed.
**Prevention:** Use `cryptography.fernet` or dedicated encrypted model fields. Always derive encryption keys from a secure secret (like `SECRET_KEY`) using a KDF or hashing, rather than using the secret directly if it doesn't match the required format.
