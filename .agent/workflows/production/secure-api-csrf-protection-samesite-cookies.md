# Secure API from CSRF

**Tags:** Security, CSRF, API, Security, Rate Limiting, API, Security, Headers, CSP, +1, Security, Authorization, RBAC, Agentic AI, Security, Vulnerability, Python, Security, Cryptography, Security, Web Development, OWASP

description: Prevent CSRF attacks

1. **Use SameSite Cookies**:
   response.headers.set('Set-Cookie', 'token=abc; SameSite=Strict; HttpOnly');

2. **Implement CSRF Tokens**:
   import { randomBytes } from 'crypto';
   export function generateCSRFToken() {
   return randomBytes(32).toString('hex');
   }

3. **Validate Origin**:
   const origin = request.headers.get('origin');
   if (!allowedOrigins.includes(origin)) {
   return Response.json({ error: 'Invalid origin' }, { status: 403 });
   }

4. **Pro Tips**:
   - Never use \* in production.
   - Validate both token and origin.
