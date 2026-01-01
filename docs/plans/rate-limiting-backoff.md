# Rate Limiting and Backoff Messaging

## Goal
Introduce Django-side throttling and surface retry guidance to frontend clients when upstream
services or API rate limits are hit.

## Scope
- Configure DRF throttling defaults for authenticated and anonymous users.
- Centralize retry/backoff hints in backend error responses.
- Clarify retry and timeout policies in the Jules API service client.

## Notes
- Retry timing is exposed as `retry_after_seconds` in API error payloads when available.
- Throttle rates are configurable via `DRF_THROTTLE_USER` and `DRF_THROTTLE_ANON`.
