## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2024-05-23 - [HIGH] IDOR in User Profile Update
**Vulnerability:** `UserViewSet` allowed any authenticated user to update any `users.User` profile because it relied on global `IsAuthenticated` but lacked object-level ownership checks. The `users.User` model is linked to `auth.User` only by email string, not a Foreign Key.
**Learning:** Default `ModelViewSet` exposes all operations on `queryset` to anyone who passes `permission_classes`. If `permission_classes` only checks `IsAuthenticated`, it's an open door for IDOR on any exposed model.
**Prevention:** Implement custom Object-level permissions (e.g., `IsProfileOwnerOrAdmin`) that checks `obj.email == request.user.email` (or appropriate owner field) for sensitive resources.
