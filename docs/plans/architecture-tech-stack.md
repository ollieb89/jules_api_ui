# Jules API UI - Architecture & Tech Stack Document

## 🏗️ ARCHITECTURE OVERVIEW

### High-Level System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                   Frontend (Angular 21 + SSR)                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Routing (Standalone Components + SSR routes)                   │  │
│  │  - / -> /dashboard redirect                                    │  │
│  │  - /users, /users/new, /users/:id/edit                          │  │
│  │  - /jules, /jules/create, /jules/:id, /jules/settings           │  │
│  │  - /jules/integrations                                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                               ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  State & UI Model                                               │  │
│  │  - Angular signals + computed state                             │  │
│  │  - Services for API orchestration                               │  │
│  │  - HttpClient for REST + SSE calls                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                               ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  UI Composition                                                 │  │
│  │  - Standalone components                                       │  │
│  │  - Tailwind utility classes for styling                         │  │
│  │  - SSR guards for browser-only APIs                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                               ↕
         ┌─────────────────────┼───────────────────────┐
         ↓                     ↓                       ↓
┌────────────────┐   ┌───────────────────┐   ┌────────────────────┐
│ Django REST API│   │ Jules API Service │   │ External Integrations│
│ /api/jules/*   │   │ (upstream agent)  │   │ GitHub, etc.         │
└────────────────┘   └───────────────────┘   └────────────────────┘
```

---

## 📁 PROJECT STRUCTURE (CURRENT)

### Root Level
```
jules_api_ui/
├── jules_api/                 # Angular 21 SSR frontend
├── jules_backend/             # Django + DRF backend
├── docs/                      # Documentation and plans
├── DESIGN_TOKENS.json
├── README.md
└── AGENTS.md
```

### Frontend (`jules_api/`)
```
jules_api/
├── src/
│   ├── app/
│   │   ├── app.routes.ts          # Client routes (standalone components)
│   │   ├── app.routes.server.ts   # SSR routes
│   │   ├── app.config.ts          # Client app config
│   │   ├── app.config.server.ts   # Server app config
│   │   ├── components/            # Shared UI components
│   │   ├── jules/                 # Jules feature area (dashboard, sessions, settings)
│   │   ├── services/              # API and state services
│   │   ├── models/                # Typed models/interfaces
│   │   └── interceptors/          # Http interceptors
│   ├── public/                    # Static assets
│   └── styles.css                 # Tailwind entry (imports Tailwind and global styles)
└── package.json
```

### Backend (`jules_backend/`)
```
jules_backend/
├── jules_backend/             # Django project (settings, urls)
├── jules/                     # Jules app (DRF viewsets, serializers)
├── users/                     # User management API
├── migrations/                # Alembic migrations (legacy)
└── tests/
```

---

## 🧭 FRONTEND ROUTING (Angular 21 Standalone + SSR)

The Angular router is configured in `jules_api/src/app/app.routes.ts`:

- `/` → redirect to `/dashboard`
- `/dashboard` → `DashboardComponent`
- `/users` → `UserListComponent`
- `/users/new` → `UserFormComponent`
- `/users/:id/edit` → `UserFormComponent`
- `/jules` → `SessionListComponent`
- `/jules/create` → `SessionCreateComponent`
- `/jules/:id` → `SessionDetailComponent`
- `/jules/settings` → `SettingsComponent`
- `/jules/integrations` → `PhaseTwoComponent`

All routes load standalone components with `loadComponent` for SSR-friendly lazy loading.

SSR rendering modes are configured in `jules_api/src/app/app.routes.server.ts`, with
server rendering for detail/edit routes and prerendering for the catch-all path.

---

## 🔌 BACKEND API SURFACE (Django REST Framework)

The Jules API endpoints are served under `/api/jules/` (see `jules_backend/jules/urls.py`).

### Core Resources
- `GET /api/jules/sources/` → list connected sources
- `GET /api/jules/sessions/` → list sessions (paginated via `page_size`, `page_token`)
- `POST /api/jules/sessions/` → create a session
- `GET /api/jules/sessions/:id/` → retrieve a session
- `DELETE /api/jules/sessions/:id/` → delete a session
- `GET /api/jules/sessions/cached-events/` → SSE for cached session list updates
- `GET /api/jules/sessions/events/` → SSE for live session list updates

### Session Actions
- `POST /api/jules/sessions/:id/approve_plan/` → approve a generated plan
- `POST /api/jules/sessions/:id/send_message/` → send a message to the agent
- `GET /api/jules/sessions/:id/activities/` → list session activities (paginated)
- `GET /api/jules/sessions/:id/cached-events/` → SSE for cached session/activity updates
- `GET /api/jules/sessions/:id/events/` → SSE for live session/activity updates
- `GET /api/jules/sessions/:id/activity-stream/` → SSE stream for activity events

### Settings & Health
- `GET /api/jules/settings/` → current API key status
- `POST /api/jules/settings/api-key/` → update API key
- `POST /api/jules/settings/test/` → test API connectivity
- `GET /api/jules/health/` → Jules API health check
- `GET /api/jules/sync/` → current background sync status
- `GET /api/jules/sync/events/` → SSE stream for sync updates

Additional system health checks are exposed at `/health` via `jules_backend/health`.

---

## ✅ TECH STACK SUMMARY

### Frontend
- **Angular 21** with SSR
- **Standalone components** and **signals** for state
- **Angular Router** with lazy `loadComponent`
- **Tailwind CSS** for styling
- **Bun** for tooling and builds

### Backend
- **Django 5 + Django REST Framework** for API endpoints
- **PostgreSQL** (dev/prod) and SQLite in-memory for tests
- **External Jules API client** for agent orchestration

### Integrations
- Jules API service (upstream agent)
- GitHub (sources and integrations)
