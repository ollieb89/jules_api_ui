---
trigger: model_decision
description: You are an expert in React 19+ usage with Vite and Feature-Sliced Design.
---

# React Project Structure (Vite & Feature-Sliced)

**Tags:** React, Vite, Structure, Architecture, FSD, Feature Sliced, Components, Hooks, +1, React, File Organization

You are an expert in React 19+ and Vite development.

## Key Principles

-   **Feature-Sliced / Usage-based:** Group files by feature/route first, then by type.
-   **Colocation:** Keep styles, tests, and sub-components close to where they are used.
-   **Barrel Exports:** Use `index.ts` files to expose public feature APIs and hide implementation details.
-   **Absolute Imports:** Use path aliases (e.g., `@/components/...`) configured in `tsconfig.json` and `vite.config.ts`.

## File Structure

```text
src/
├── app/                    # Global app setup (providers, router, styles)
│   ├── routes/             # Route definitions
│   └── App.tsx
├── components/             # Shared/Generic UI components (Button, Input)
│   └── ui/                 # Shadcn/Radix primitives
├── features/               # Smart features (Business Logic)
│   ├── auth/
│   │   ├── components/     # LoginForm, RegisterForm
│   │   ├── hooks/          # useAuth, useLogin
│   │   ├── services/       # auth.service.ts
│   │   ├── types/
│   │   └── index.ts        # Public API
│   └── dashboard/
├── hooks/                  # Shared custom hooks (useDebounce, useLocalStorage)
├── lib/                    # Utilities, API clients (axios/fetch wrapper), cn utility
├── stores/                 # Global state stores (Zustand/Jotai)
├── types/                  # Global type definitions
└── main.tsx                # Entry point
```

## Component Standards

### 1. Functional Components

Always use function declarations or arrow functions consistently.

```typescript
// features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const { login } = useAuth();

  return (
    <form action={login}>
      <input 
        name="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <Button type="submit">Login</Button>
    </form>
  );
};
```

### 2. React 19 Patterns

-   **Refs:** Pass `ref` directly as a prop (No more `forwardRef` needed in React 19).
-   **Context:** Use `<Context>` instead of `<Context.Provider>`.
-   **Server Actions (if applicable/Next.js-like):** Use `useActionState` (formerly `useFormState`) for form handling.

### 3. Smart vs. Dumb

-   **Wrapper/Container:** Handles data fetching/store connection.
-   **Presentational:** Receives props, renders UI.

## Environment Variables

Access via `import.meta.env`.

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

## Best Practices

-   **One Component Per File:** Generally one component export per file.
-   **PascalCase:** Files containing components should be PascalCase (`UserProfile.tsx`).
-   **camelCase:** Hooks and utilities should be camelCase (`useAuth.ts`).
