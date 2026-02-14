## 2024-05-22 - [CRITICAL] Authentication Bypass in Base ViewSet
**Vulnerability:** The base class `JulesAuthenticatedViewSet` had `permission_classes = ()`, which overrode the global default `IsAuthenticated` permission. This effectively made all endpoints inheriting from it (including sensitive ones like `SessionViewSet` and `SourceViewSet`) public and accessible without authentication.
**Learning:** Defining empty `permission_classes` in a DRF ViewSet completely removes all permission checks, even if `authentication_classes` are set. Authentication classes only identify the user (or set AnonymousUser); they do not deny access. Permission classes are responsible for access control.
**Prevention:** Never leave `permission_classes` empty in a base ViewSet intended to be secure. Always explicitly set `permission_classes = (IsAuthenticated,)` or ensure it inherits the desired defaults by not defining it at all (if defaults are secure). Add unit tests that specifically check for 401/403 responses on protected endpoints using `AnonymousUser`.

## 2025-02-14 - [HIGH] IDOR in User Profile Enumeration
**Vulnerability:** The `UserViewSet` allowed any authenticated user to list all user profiles (`GET /api/users/`) and view details of any other user (`GET /api/users/{id}/`). This was due to `IsProfileOwnerOrAdmin` permission allowing all `SAFE_METHODS` (GET/HEAD/OPTIONS) globally, and `UserViewSet` not filtering the queryset for non-admin users.
**Learning:** DRF's `has_object_permission` is only called for detail views, not list views. List views rely on `get_queryset` filtering to restrict access. Also, `SAFE_METHODS` should not be blindly allowed in permissions if the object contains sensitive data (like PII) that shouldn't be public to all authenticated users.
**Prevention:**
1. Avoid `SAFE_METHODS` checks in permissions for private resources; explicitly check ownership even for read access.
2. Always override `get_queryset` in ViewSets to filter results based on the current user, especially for `list` operations.
3. Test both detail (`/id/`) and list (`/`) endpoints for unauthorized access.
