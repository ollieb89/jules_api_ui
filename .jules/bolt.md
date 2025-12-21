# Bolt's Journal - Critical Learnings Only

## 2024-12-21 - Angular SSR/Prerender Config
**Learning:** Angular 21's new build system defaults to `Prerender` for `**` routes. Dynamic routes like `users/:id/edit` fail build unless explicitly set to `RenderMode.Server` or provided with prerender params.
**Action:** Always check `app.routes.server.ts` when adding dynamic routes to ensure they use `RenderMode.Server` if not prerendering.
