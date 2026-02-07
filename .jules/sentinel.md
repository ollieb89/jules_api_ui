## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-02-23 - [CRITICAL] Admin Privilege Escalation in Settings
**Vulnerability:** The `SettingsViewSet` used the default `IsAuthenticated` permission from its base class, allowing any logged-in user to view and modify global system settings (including the API key).
**Learning:** Sensitive administrative endpoints must explicitly enforce higher privilege levels (e.g., `IsAdminUser`) and not rely on generic base class permissions which are typically sufficient only for regular user actions.
**Prevention:** Audit all ViewSets that manage global or sensitive data. Explicitly set `permission_classes = (IsAdminUser,)` for administrative views. Use regression tests that assert 403 Forbidden for regular users on these endpoints.
