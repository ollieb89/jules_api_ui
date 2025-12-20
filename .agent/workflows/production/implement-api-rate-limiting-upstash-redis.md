# Implement Rate Limiting

**Tags:** Security, Rate Limiting, API, Security, CSRF, API, Security, Headers, CSP, +1, Security, Authorization, RBAC, Agentic AI, Security, Vulnerability, Python, Security, Cryptography, Security, Web Development, OWASP

description: Protect APIs with rate limits

1. **Install Upstash**:
   // turbo
   - Run npm install @upstash/ratelimit @upstash/redis

2. **Setup**:
   import { Ratelimit } from '@upstash/ratelimit';

   const ratelimit = new Ratelimit({
   redis,
   limiter: Ratelimit.slidingWindow(10, '10 s')
   });

3. **Apply to Routes**:
   const { success } = await ratelimit.limit(ip);
   if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });

4. **Pro Tips**:
   - Different limits per endpoint.
   - Log violations.
