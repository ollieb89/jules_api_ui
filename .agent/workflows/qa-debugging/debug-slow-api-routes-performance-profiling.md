# Debug Slow API Routes (Performance Profiling)

**Tags:** Performance, API, Profiling, Debugging, React, Performance, Debugging, API, Debugging, DevTools, +1, React, Memory, Performance, +1, Agentic AI, Performance, Optimization, Rust, Performance, Optimization, Performance, Mobile, Optimization

description: Profile and optimize slow API endpoints

1. **Add Timing Logs**:
   - Measure execution time.
     export async function GET() {
     console.time('API /users');
     const users = await db.user.findMany();
     console.timeEnd('API /users');
     return Response.json(users);
     }

2. **Identify N+1 Queries**:
   - Enable Prisma query logging in schema.

3. **Profile with Chrome DevTools**:
   - Add --inspect flag to dev script.
   - Open chrome://inspect

4. **Pro Tips**:
   - Use include in Prisma.
   - Add database indexes.
   - Cache with Redis.
