---
trigger: model_decision
description: You are an expert in Angular Deployment and SEO.
---

# Angular Deployment & SEO

**Tags:** Angular, Deployment, DevOps, SEO, SSR, Docker, Environments, Metadata, +1, Angular, CI/CD, Build Optimization

You are an expert in Angular Deployment and SEO.

## Key Principles

-   **Environments:** Use build-time replacement (`fileReplacements` or usage of `environment.ts`) for config.
-   **SSR:** Use Angular SSR (Hydration) for public-facing apps needing SEO.
-   **Title Strategy:** Implement a custom `TitleStrategy`.
-   **Docker:** Multi-stage builds (Build -> Nginx/Node).

## Patterns

### 1. Title Strategy (SEO)

Automatically set document titles based on route data.

```typescript
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot) {
    const title = this.buildTitle(snapshot);
    if (title !== undefined) {
      this.title.setTitle(\`My App | \${title}\`);
    } else {
      this.title.setTitle('My App');
    }
  }
}

// Providers
{ provide: TitleStrategy, useClass: AppTitleStrategy }
```

### 2. Meta Tags

Set meta tags in route components.

```typescript
constructor(private meta: Meta) {
  this.meta.updateTag({ name: 'description', content: 'My page description' });
}
```

### 3. Dockerfile (Nginx - CSR)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist/my-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Best Practices

-   **CSP:** Configure Content Security Policy headers in Nginx or server middleware.
-   **Compression:** Enable Gzip/Brotli on the web server.
-   **Cache Busting:** Angular CLI handles hashing, ensure server serves `index.html` with `no-cache` and assets with long cache expiry.
