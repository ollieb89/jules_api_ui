## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-01-20 - Enforcing SECRET_KEY in Production
**Vulnerability:** The application was configured to fallback to a known insecure `SECRET_KEY` (`django-insecure-change-this-in-production`) when `DJANGO_SECRET_KEY` was missing, even in production mode (`DEBUG=False`).
**Learning:** Default fallbacks in `settings.py` for critical security values can silently mask configuration errors, leaving production deployments vulnerable if environment variables are accidentally omitted.
**Prevention:** In `settings.py`, explicitly check for `DEBUG` or `TESTING` flags. If neither is true, raise `ImproperlyConfigured` when critical secrets are missing, forcing the deployment to fail securely (fail-fast) rather than running insecurely.

## 2025-01-21 - Redundant Settings Configuration Overriding Security Headers
**Vulnerability:** The `settings.py` file contained multiple disconnected `if not DEBUG:` blocks. A later block re-declared HSTS settings (specifically `SECURE_HSTS_INCLUDE_SUBDOMAINS` and `SECURE_HSTS_PRELOAD`) as `False`, silently overriding the `True` values set in an earlier block, leaving production deployments with weaker transport security.
**Learning:** Scattered configuration logic for the same environment (e.g., `if not DEBUG:`) is prone to regression and conflicts where later definitions silently win.
**Prevention:** Consolidate all environment-specific security configuration into a single, cohesive block in `settings.py`. Use automated tests to assert the final state of critical security settings in production mode.
