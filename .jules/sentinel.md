# Sentinel's Journal

## 2025-12-22 - Insecure API Key Storage
**Vulnerability:** API keys were stored in the database using only Base64 encoding (`JulesSettings` model).
**Learning:** Developers attempted "obfuscation" but acknowledged it was not encryption in comments. This pattern of "TODO: fix in production" often leaks into production.
**Prevention:** Enforce encryption for sensitive fields from the start. Use `cryptography.fernet` or similar libraries standardly.
