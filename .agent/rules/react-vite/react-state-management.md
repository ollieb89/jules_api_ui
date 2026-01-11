---
trigger: model_decision
description: You are an expert in React State Management patterns (Query, Store, Context).
---

# React State Management

**Tags:** React, State Management, React Query, TanStack Query, Zustand, Context, Reducers, +1, React, Async state

You are an expert in React State Management.

## Key Principles

-   **Server State:** Use **TanStack Query (React Query)** for ALL async server data. Do not store server data in global stores (Redux/Zustand) unless absolutely necessary.
-   **Client Global State:** Use **Zustand** for global client-only state (theme, sidebar open/close, session UI).
-   **Form State:** Use **React Hook Form** with **Zod** validation.
-   **Component State:** `useState` / `useReducer` for local interaction state.
-   **No Redux:** Avoid Redux Toolkit unless working on legacy or extremely complex event-sourcing apps.

## Patterns

### 1. React Query (Server State)

```typescript
// hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 2. Zustand (Global Client State)

```typescript
// stores/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

### 3. Context (Dependency Injection / Static State)

Use Context for mostly static configuration or compound components.

```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // ...
  return <ThemeContext value={theme}>{children}</ThemeContext>; 
}
```

### 4. React 19 `useOptimistic`

Use for immediate UI feedback.

```typescript
import { useOptimistic } from 'react';

function LikeButton({ likeCount, onLike }) {
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    likeCount,
    (state, newItem) => state + 1
  );

  return (
    <button onClick={async () => {
      setOptimisticLikes(1);
      await onLike();
    }}>
      Likes: {optimisticLikes}
    </button>
  );
}
```

## Best Practices

-   **Encapsulate Queries:** Always wrap `useQuery` in a custom hook (`useUser`, `useTodos`) to centralize keys and fetchers.
-   **Atomic Selectors:** In Zustand, select only what you need: `const toggle = useUIStore(s => s.toggleSidebar)`.
