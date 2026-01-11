# Jules session and activity persistence

## Scope
- Persist Jules sessions and activities to the Django database.
- Update API views to write through to local storage while serving API responses.
- Add a periodic sync job to reconcile sessions/activities from the Jules API.

## Implementation notes
- Models: `backend/jules/models.py` with `JulesSession` + `JulesActivity`.
- Sync helpers: `backend/jules/sync.py` used by API views and the management command.
- Management command: `backend/jules/management/commands/sync_jules_sessions.py`.
- Migration: `backend/jules/migrations/0002_add_sessions_activities.py`.
