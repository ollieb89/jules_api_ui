# Current Architecture Snapshot (Angular 21 SSR + Django)

## Goal
Maintain a single reference for the live application architecture, reflecting the Angular 21 SSR
frontend and Django REST backend as implemented today.

## Frontend Overview (Angular 21 SSR)
- **Standalone components** with `loadComponent` routing and no NgModules.
- **Signals** and computed state for UI/data modeling.
- **SSR render modes** configured in `frontend/src/app/app.routes.server.ts`:
  - Server-rendered: `users/:id/edit`, `jules/:id`
  - Prerendered: `**` catch-all
- **Route map** from `frontend/src/app/app.routes.ts`:
  - `/` → `/dashboard`
  - `/dashboard`
  - `/users`, `/users/new`, `/users/:id/edit`
  - `/jules`, `/jules/create`, `/jules/:id`, `/jules/settings`
  - `/jules/integrations`

## Backend Overview (Django REST Framework)
Routes are registered via the router in `backend/jules/urls.py` and implemented in
`backend/jules/views.py`.

### Core APIs
- `GET /api/jules/sources/`
- `GET /api/jules/sessions/`
- `POST /api/jules/sessions/`
- `GET /api/jules/sessions/:id/`
- `DELETE /api/jules/sessions/:id/`
- `GET /api/jules/sessions/cached-events/`
- `GET /api/jules/sessions/events/`

### Session Actions
- `POST /api/jules/sessions/:id/approve_plan/`
- `POST /api/jules/sessions/:id/send_message/`
- `GET /api/jules/sessions/:id/activities/`
- `GET /api/jules/sessions/:id/cached-events/`
- `GET /api/jules/sessions/:id/events/`
- `GET /api/jules/sessions/:id/activity-stream/`

### Settings, Health, Sync
- `GET /api/jules/settings/`
- `POST /api/jules/settings/api-key/`
- `POST /api/jules/settings/test/`
- `GET /api/jules/health/`
- `GET /api/jules/sync/`
- `GET /api/jules/sync/events/`

## Notes
- Keep frontend API services aligned with `/api/jules/*` routes.
- When introducing new SSR-only components, ensure browser-only APIs are guarded.
