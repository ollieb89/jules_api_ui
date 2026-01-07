## 2025-01-20 - Enforcing SECRET_KEY in Production
**Vulnerability:** The application was configured to fallback to a known insecure `SECRET_KEY` (`django-insecure-change-this-in-production`) when `DJANGO_SECRET_KEY` was missing, even in production mode (`DEBUG=False`).
**Learning:** Default fallbacks in `settings.py` for critical security values can silently mask configuration errors, leaving production deployments vulnerable if environment variables are accidentally omitted.
**Prevention:** In `settings.py`, explicitly check for `DEBUG` or `TESTING` flags. If neither is true, raise `ImproperlyConfigured` when critical secrets are missing, forcing the deployment to fail securely (fail-fast) rather than running insecurely.
