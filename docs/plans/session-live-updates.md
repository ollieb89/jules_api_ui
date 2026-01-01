# Session live updates (SSE)

## Scope
- Add server-sent event endpoints for session list updates and per-session activity updates.
- Consume SSE in the session detail view and session cache service.
- Reduce polling frequency to lower backend load while maintaining timely updates.

## Notes
- SSE endpoints authenticate via JWT bearer header or `token` query param.
- Frontend uses EventSource only on the browser runtime.
