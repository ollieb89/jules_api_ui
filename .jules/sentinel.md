## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-05-27 - [HIGH] Missing Authorization on Global Settings
**Vulnerability:** The `SettingsViewSet` inherited `IsAuthenticated` but lacked `IsAdminUser`, allowing any registered user to modify global system configuration (including the API key).
**Learning:** `IsAuthenticated` only proves identity, not authority. Sensitive endpoints affecting global state must enforce higher privileges (e.g., `IsAdminUser`).
**Prevention:** Audit all ViewSets inheriting from generic authenticated base classes. Specifically check if they expose administrative actions and apply `permission_classes = (IsAdminUser,)` explicitly where needed. Include tests verifying 403 Forbidden for regular users.
