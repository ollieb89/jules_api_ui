## 2025-01-20 - Enforcing SECRET_KEY in Production
**Vulnerability:** The application was configured to fallback to a known insecure `SECRET_KEY` (`django-insecure-change-this-in-production`) when `DJANGO_SECRET_KEY` was missing, even in production mode (`DEBUG=False`).
**Learning:** Default fallbacks in `settings.py` for critical security values can silently mask configuration errors, leaving production deployments vulnerable if environment variables are accidentally omitted.
**Prevention:** In `settings.py`, explicitly check for `DEBUG` or `TESTING` flags. If neither is true, raise `ImproperlyConfigured` when critical secrets are missing, forcing the deployment to fail securely (fail-fast) rather than running insecurely.

## 2025-01-21 - Redundant Settings Configuration Overriding Security Headers
**Vulnerability:** The `settings.py` file contained multiple disconnected `if not DEBUG:` blocks. A later block re-declared HSTS settings (specifically `SECURE_HSTS_INCLUDE_SUBDOMAINS` and `SECURE_HSTS_PRELOAD`) as `False`, silently overriding the `True` values set in an earlier block, leaving production deployments with weaker transport security.
**Learning:** Scattered configuration logic for the same environment (e.g., `if not DEBUG:`) is prone to regression and conflicts where later definitions silently win.
**Prevention:** Consolidate all environment-specific security configuration into a single, cohesive block in `settings.py`. Use automated tests to assert the final state of critical security settings in production mode.
