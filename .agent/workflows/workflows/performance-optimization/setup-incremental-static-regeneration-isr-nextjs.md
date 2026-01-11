# Setup Incremental Static Regeneration

**Tags:** Next.js, Performance, Caching, Backend, Caching, Performance, +1, Performance, Images, Optimization, +1, Performance, API, React, +1, Next.js, Performance, Optimization, Agentic AI, Performance, Optimization, Redis, Caching, NoSQL

description: Serve static pages with auto-updates

1. **Enable ISR**:
   export const revalidate = 60; // seconds

   export default async function Page() {
   const data = await fetchData();
   return <div>{data}</div>;
   }

2. **On-Demand Revalidation**:
   import { revalidatePath } from 'next/cache';

   export async function POST(request: Request) {
   const { path } = await request.json();
   revalidatePath(path);
   return Response.json({ revalidated: true });
   }

3. **Pro Tips**:
   - Use tags for bulk revalidation.
   - Perfect for blogs and e-commerce.
