# Current Architecture Snapshot

## Purpose
This document captures the current high-level architecture for the Jules API UI,
reflecting the Angular 21 SSR frontend and the Django REST backend endpoints.

## Frontend (Angular 21 + SSR)
- **Routing**: Standalone component routes are defined in `jules_api/src/app/app.routes.ts` and
  lazily load feature components with `loadComponent`.
- **SSR configuration**: Server rendering modes live in `jules_api/src/app/app.routes.server.ts`,
  enabling SSR for detail/edit routes and prerendering for catch-all paths.
- **State**: UI state uses Angular **signals** and computed values, with services orchestrating
  API calls through `HttpClient`.

### Route map (client)
- `/` → redirect to `/dashboard`
- `/dashboard` → dashboard overview
- `/users` → user list
- `/users/new` → user creation
- `/users/:id/edit` → user edit
- `/jules` → session list
- `/jules/create` → session creation
- `/jules/:id` → session detail
- `/jules/settings` → settings
- `/jules/integrations` → integrations placeholder

## Backend (Django + DRF)
- **Base API namespace**: `/api/jules/`
- **Core resources**:
  - `sources/` for connected source repositories
  - `sessions/` for session list/create/retrieve/delete
  - `settings/` for API key configuration
  - `health/` for upstream connectivity checks
  - `sync/` for background sync status
- **SSE endpoints**:
  - `sessions/cached-events/` and `sessions/events/` for session list updates
  - `sessions/:id/cached-events/`, `sessions/:id/events/`, `sessions/:id/activity-stream/` for
    per-session activity streaming
  - `sync/events/` for sync status updates

## Integrations
- External Jules API client (server-side service in `jules_backend/jules/services.py`).
- GitHub as a source integration for repositories.
