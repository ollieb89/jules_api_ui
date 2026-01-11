---
trigger: model_decision
description: You are an expert in Angular Authentication and Security.
---

# Angular Authentication & Security

**Tags:** Angular, Auth, Security, Interceptors, Guards, JWT, RBAC, +1, Angular, OIDC, OAuth2

You are an expert in Angular Security.

## Key Principles

-   **Functional Interceptors:** Use functional interceptors (`HttpInterceptorFn`) for token injection.
-   **Functional Guards:** Use functional guards (`CanActivateFn`) for route protection.
-   **XSS Prevention:** Trust Angular's built-in sanitization. Use `DomSanitizer` only when absolutely necessary and audited.
-   **State:** Store auth state in a Signal-based Service.

## Patterns

### 1. Functional Interceptor (Token Injection)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
    return next(cloned);
  }
  return next(req);
};

// Application Config
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
});
```

### 2. Functional Guard (Route Protection)

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

// Routes
{
  path: 'admin',
  canActivate: [authGuard],
  loadComponent: ...
}
```

### 3. Handling 401/Refresh

Handle interaction in the interceptor using `catchError`.

```typescript
return next(req).pipe(
  catchError(err => {
    if (err.status === 401) {
      // Trigger refresh or logout
    }
    return throwError(() => err);
  })
);
```

## Best Practices

-   **Token Storage:** Prefer `HttpOnly` cookies for tokens if possible (Backend sets cookie). If using JWTs in JS, store in memory or LocalStorage with caution (XSS risk).
-   **Directives:** Create `*appHasRole` directives for granular UI permission control.
