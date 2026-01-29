## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2024-05-24 - [CRITICAL] Privilege Escalation in Settings API
**Vulnerability:** The `SettingsViewSet.update_api_key` endpoint allowed any authenticated user to update the global API key, leading to privilege escalation.
**Learning:** Default permissions (`IsAuthenticated`) are insufficient for administrative actions. `IsAdminUser` or custom permissions must be explicitly applied to sensitive actions, even within an authenticated viewset.
**Prevention:** Audit all actions modifying global state or sensitive configuration. Ensure they are protected by `IsAdminUser` or specific role-based permissions. Use `@action(permission_classes=[...])` to override default viewset permissions.
