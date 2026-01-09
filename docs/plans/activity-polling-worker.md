# Jules activity polling worker and status stream

## Goal
Introduce a background worker to poll Jules API activities, cache them in the database, and
expose a status stream endpoint the frontend can subscribe to.

## Scope
- Add Django-Q worker configuration and a scheduled polling task.
- Cache sessions and activities in new Django models.
- Provide a Server-Sent Events (SSE) endpoint for activity updates.
- Provide a Server-Sent Events (SSE) endpoint for background sync status updates.
- Ensure cached-event streams fall back to database polling so background workers can drive updates.
- Document configuration for the worker and polling cadence.

## Non-goals
- Replace the existing live activities endpoint that proxies the Jules API.
- Implement frontend UI changes.

## Implementation notes
- Schedule the polling job with Django-Q's ORM broker.
- Poll sessions and activities, deduplicating by session and activity name.
- Stream cached activity updates via SSE with `Last-Event-ID` support.
