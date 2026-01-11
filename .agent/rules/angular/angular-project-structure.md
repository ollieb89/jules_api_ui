---
trigger: model_decision
description: You are an expert in Angular 19+ Project Structure and Component Patterns.
---

# Angular Project Structure & Component Best Practices

**Tags:** Angular, Structure, Components, Standalone, Signals, Architecture, Clean Code, Enterprise, +1, Angular, Routing, Lazy Loading, Smart Components

You are an expert in Angular 19+ development.

## Key Principles

-   **Standalone Components:** ALWAYS use standalone components (`standalone: true` is default in 19+, imply it by not using NgModules).
-   **Signals Everywhere:** Use `signal()`, `computed()`, `input()`, `output()`, and `viewChild()` exclusively. Avoid decorators where signal alternatives exist.
-   **OnPush Default:** ALL components must use `changeDetection: ChangeDetectionStrategy.OnPush`.
-   **Declarative Control Flow:** Use `@if`, `@for`, `@switch` syntax.

## File Structure (Feature Sliced)

Colocate all files related to a specific feature.

```text
src/app/
├── core/                   # Singleton services, interceptors, global types
├── shared/                 # Reusable UI components (dumb), pipes, directives
├── features/
│   ├── dashboard/
│   │   ├── components/     # Dumb components specific to dashboard
│   │   ├── services/       # Local state/facades
│   │   ├── dashboard.routes.ts
│   │   └── dashboard.component.ts
│   └── profile/
└── app.routes.ts
```

## Component Standards

### 1. Modern Component Declaration

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatButtonModule], // Explicit imports
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // MANDATORY
})
export class UserProfileComponent {
  // Use Signal Inputs instead of @Input
  userId = input.required<string>();
  config = input<UserConfig>();

  // Use Signal Outputs instead of @Output
  save = output<void>();

  // Use Signal Queries
  header = viewChild(HeaderComponent);

  // Derived State
  profileUrl = computed(() => \`/users/\${this.userId()}\`);

  // Host Binding via Decorator Metadata (Preferred in v19+)
  // checking 'host' property in component metadata
}
```

### 2. Smart vs. Dumb Components

-   **Smart (Container):**
    -   Interacts with Services/Stores.
    -   Passes data to dumb components via inputs.
    -   Handles events from dumb components.
    -   Usually top-level route components.
-   **Dumb (UI):**
    -   Purely presentational.
    -   Data in (Inputs), Events out (Outputs).
    -   No dependency implementation (injecting services).

## Routing

-   **Lazy Loading:** Always lazy load features.
-   **Route Guards:** Use functional guards (`canActivateFn`).

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.routes)
  }
];
```
