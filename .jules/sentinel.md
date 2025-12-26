## 2024-05-23 - Information Leakage in API Error Responses
**Vulnerability:** API endpoints were catching generic `Exception` and returning `str(e)` directly to the client in 500 responses.
**Learning:** This practice leaks sensitive internal details (stack traces, database connection strings, paths) which can help attackers map the system. It existed because the error handling was manually implemented in each view without a secure default.
**Prevention:** Use a centralized exception handler (`handle_view_exception`) that logs the full error server-side (for debugging) but returns a generic "An unexpected error occurred" message to the client. Ensure `APIException` (like `ValidationError`) is still passed through correctly.
