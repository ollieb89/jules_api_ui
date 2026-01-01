# Session live updates (SSE)

## Scope
- Add cached SSE endpoints for session list updates and per-session activity updates.
- Consume cached SSE in the session detail view and session cache service.
- Reduce polling frequency to lower backend load while maintaining timely updates.

## Notes
- Cached SSE endpoints stream updates from the local database cache, not direct API polling.
- SSE endpoints authenticate via JWT bearer header or `token` query param.
- Frontend uses EventSource only on the browser runtime.
