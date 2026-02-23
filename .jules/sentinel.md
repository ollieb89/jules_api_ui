## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-02-12 - [CRITICAL] Privilege Escalation in Settings ViewSet
**Vulnerability:** `SettingsViewSet` inherited `IsAuthenticated` from `JulesAuthenticatedViewSet` but did not enforce `IsAdminUser`. This allowed any authenticated user to view and update global API keys.
**Learning:** Inheriting from a base authenticated ViewSet is not enough for sensitive administrative actions. Granular permissions must be applied.
**Prevention:** Explicitly add `IsAdminUser` (or custom permission) to `permission_classes` for any ViewSet that modifies global configuration or sensitive system data. Test with both regular and admin users.
