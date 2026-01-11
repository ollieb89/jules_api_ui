---
description: Next.js, Migration, App Router, Refactoring, Debugging, Git, Dependencies, +1, VS Code, Monorepo, Productivity, +1, Monorepo, Turborepo, Build, +1, Next.js, App Router, Routing, Agentic AI, Migration, Upgrade, Agentic AI, Refactoring, Clean Code
---

# Migrate from Pages Router to App Router

**Tags:** Next.js, Migration, App Router, Refactoring, Debugging, Git, Dependencies, +1, VS Code, Monorepo, Productivity, +1, Monorepo, Turborepo, Build, +1, Next.js, App Router, Routing, Agentic AI, Migration, Upgrade, Agentic AI, Refactoring, Clean Code

description: Incrementally migrate Next.js Pages Router to App Router

1. **Enable App Router**:
   - Create app directory alongside pages.
   - Both routers work simultaneously during migration.

2. **Convert getServerSideProps**:
   - Pages Router:
     export async function getServerSideProps() {
     const data = await fetchData();
     return { props: { data } };
     }
   - App Router (Server Component):
     async function Page() {
     const data = await fetchData();
     return <div>{data}</div>;
     }

3. **Convert getStaticProps**:
   - Use generateStaticParams for dynamic routes.
     export async function generateStaticParams() {
     const posts = await getPosts();
     return posts.map((post) => ({ slug: post.slug }));
     }

4. **Migrate API Routes**:
   - Move from pages/api/_ to app/api/_/route.ts.
     // app/api/users/route.ts
     export async function GET() {
     return Response.json({ users: [] });
     }

5. **Update Middleware**:
   - Middleware works the same, but update imports.
     import { NextResponse } from 'next/server';
     export function middleware(request) {
     return NextResponse.next();
     }

6. **Pro Tips**:
   - Migrate page by page, not all at once.
   - Use use client directive for client components.
   - Test thoroughly - data fetching patterns are different.
   - App Router is the future; prioritize new features there.
