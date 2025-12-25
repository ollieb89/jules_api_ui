# Sentinel's Journal

## 2024-05-22 - Insecure API Key Storage
**Vulnerability:** API Keys in `JulesSettings` are stored using Base64 encoding instead of encryption.
**Learning:** The codebase acknowledges this with a comment `# In production, use proper encryption`, but it presents a high risk if the database is compromised.
**Prevention:** Use `fernet` or similar field-level encryption libraries for sensitive data fields.

## 2024-05-22 - Mixed Framework Identity
**Vulnerability:** The project uses both FastAPI and Django, but `pixi.toml` and `manage.py` suggest a migration to Django. This leads to confusion on which dependencies are active and which security middleware is applied.
**Learning:** Legacy or transitional code can hide vulnerabilities if it's unclear what is actually running in production.
**Prevention:** Clearly deprecate and remove unused frameworks/routes. Ensure documentation (`AGENTS.md`) matches the active deployment configuration.

## 2024-12-25 - Encrypted API Key Storage
**Vulnerability:** `JulesSettings` stored API keys using simple Base64 encoding.
**Learning:** Comments indicating "TODO" for security features often persist into production.
**Prevention:** Enforce security requirements (encryption at rest) in CI/CD or linting rules for fields named `api_key` or `secret`.
