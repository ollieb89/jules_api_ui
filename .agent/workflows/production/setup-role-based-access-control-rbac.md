# Setup RBAC

**Tags:** Security, Authorization, RBAC, Security, Headers, CSP, +1, Security, Rate Limiting, API, Security, CSRF, API, Agentic AI, Security, Vulnerability, Python, Security, Cryptography, Security, Web Development, OWASP

description: Role-based permissions

1. **Define Roles**:
   enum Role {
   USER
   ADMIN
   MODERATOR
   }

2. **Protect Routes**:
   if (session?.user?.role !== 'ADMIN') {
   return Response.json({ error: 'Forbidden' }, { status: 403 });
   }

3. **Conditional UI**:
   {isAdmin && <AdminPanel />}

4. **Pro Tips**:
   - Use enums for type safety.
   - Cache permissions.
