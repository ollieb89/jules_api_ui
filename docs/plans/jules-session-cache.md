# Jules Session Local Cache Plan

## Summary
Introduce a local persistence layer for Jules sessions and activities so API calls can reuse
recent data without repeatedly fetching from the upstream service.

## Scope
- Add Django models for sessions and activities, including a JSON payload for activity details.
- Update viewsets to upsert data returned from the Jules API into the local store.
- Add cache-based freshness checks to serve sessions/activities from the local store when
  recently synced.

## Freshness Strategy
- Sessions list cache TTL: 60 seconds (cache key `jules:sessions:last_sync`).
- Activities cache TTL: 30 seconds per session (cache key
  `jules:sessions:{session_id}:activities:last_sync`).
- Provide a `refresh=true` query parameter to bypass cached responses.

## Migration Notes
- A new migration introduces `JulesSession` and `JulesActivity` tables.
- Local data mirrors API responses; no changes to external API contracts.
