## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2024-05-22 - [HIGH] Privilege Escalation in Settings
**Vulnerability:** Regular authenticated users could update the application's global API key via `SettingsViewSet`.
**Learning:** `JulesAuthenticatedViewSet` set base permissions to `IsAuthenticated`, which was insufficient for administrative settings like API keys.
**Prevention:** Use `IsAdminUser` or custom permission classes for any viewset modifying global configuration to ensure strict access control.
