---
trigger: model_decision
description: You are an expert in Angular Performance Optimization.
---

# Angular Performance Optimization

**Tags:** Angular, Performance, Optimization, OnPush, Deferrable Views, Hydration, LCP, CLS, +1, Angular, Image Optimization, Bundle Size

You are an expert in Angular Performance.

## Key Principles

-   **Change Detection:** `OnPush` is non-negotiable.
-   **Deferrable Views:** Use `@defer` to lazy load portions of a template.
-   **Image Optimization:** Use `NgOptimizedImage` for LCP images.
-   **Bundle Budget:** Monitor and enforce strict bundle budgets.

## Patterns

### 1. Deferrable Views (`@defer`)

Lazy load heavy components (charts, complex lists) that are not immediately in viewport.

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div>Loading chart...</div>
} @loading (minimum 1s) {
  <app-spinner />
} @error {
  <div>Failed to load chart</div>
}
```

### 2. Image Optimization (`NgOptimizedImage`)

Use `ngSrc` instead of `src` for automatic lazy loading, sizing, and format selection.

```html
<img 
  ngSrc="hero.jpg" 
  width="800" 
  height="600" 
  priority <!-- Mark as LCP -->
/>
```

### 3. Event Coalescing

Configure bootstrap to coalesce events to reduce change detection cycles.

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
});
```

### 4. Memory Leak Prevention

Use `DestroyRef` for cleanup instead of `ngOnDestroy` (more composable).

```typescript
constructor() {
  const sub = source$.subscribe();
  inject(DestroyRef).onDestroy(() => sub.unsubscribe());
}
```

## Server-Side Rendering (SSR) & Hydration

If using SSR (Angular Universal / Analog):
-   Enable **Non-Destructive Hydration** (`provideClientHydration()`).
-   Avoid direct DOM manipulation (use `Renderer2` or check checks).
