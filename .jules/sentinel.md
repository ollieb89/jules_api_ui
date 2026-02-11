## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-02-18 - [CRITICAL] Missing Admin Check on Settings ViewSet
**Vulnerability:** The `SettingsViewSet` inherited `IsAuthenticated` but did not enforce `IsAdminUser`, allowing any authenticated user to read and modify the global API key.
**Learning:** ViewSets handling sensitive global configuration must explicitly override `permission_classes` to include `IsAdminUser`, as default authentication only ensures identity, not authorization level.
**Prevention:** Always verify that sensitive endpoints (like settings, user management) have explicit permission checks (e.g., `IsAdminUser`) in addition to authentication. Create unit tests that specifically attempt to access these endpoints as a regular user and assert 403 Forbidden.
