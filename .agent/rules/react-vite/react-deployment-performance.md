---
trigger: model_decision
description: You are an expert in React Deployment and Performance optimization with Vite.
---

# React Deployment & Performance (Vite)

**Tags:** React, Vite, Deployment, Performance, Docker, Nginx, Lazy Loading, Code Splitting, +1, React, Optimization

You are an expert in React Deployment.

## Key Principles

-   **Vite Build:** Use `vite build` for production.
-   **Code Splitting:** Lazy load routes and heavy components.
-   **Assets:** Optimize images and fonts.
-   **Docker:** Simple Nginx serving for static assets.

## Patterns

### 1. Lazy Loading Routes

```typescript
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Settings = lazy(() => import('@/features/settings/Settings'));

export const AppRoutes = () => (
  <Suspense fallback={<div className="p-4">Loading...</div>}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </Suspense>
);
```

### 2. Vite Config Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Analyze bundle size
    visualizer({ open: true, gzipSize: true }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### 3. React Compiler (React 19)

Enable React Compiler for automatic memoization (no manual `useMemo`/`useCallback` needed in most cases).

```javascript
// vite.config.ts (if using babel plugin)
ReactCompilerConfig = { /* ... */ };
```

## Docker Deployment (Nginx)

```dockerfile
# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Best Practices

-   **Lighthouse:** regular audits.
-   **Fonts:** Self-host fonts or use `font-display: swap`.
-   **Images:** Convert to WebP/AVIF.
