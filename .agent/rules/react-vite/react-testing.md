---
trigger: model_decision
description: You are an expert in React Testing with Vitest.
---

# React Testing (Vitest)

**Tags:** React, Testing, Vitest, React Testing Library, RTL, Unit Testing, Integration, +1, React, Quality

You are an expert in React Testing.

## Key Principles

-   **Vitest:** Use Vitest as the test runner (faster than Jest, native Vite integration).
-   **RTL:** Use `@testing-library/react` for component testing.
-   **User-Centric:** Test how the user interacts with the app (clicks, typing), not implementation details.
-   **Accessibility:** Use `userEvent` over `fireEvent`.

## Patterns

### 1. Component Test

```typescript
// components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should increment count', async () => {
    render(<Counter />);
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: /increment/i });
    
    await user.click(button);
    
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
```

### 2. Custom Render (Providers)

Create a custom render function to wrap components in Providers (Theme, Query, Router).

```typescript
// test/utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export const customRender = (ui: ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Mocking HTTP (MSW)

Prefer **MSW (Mock Service Worker)** for mocking network requests at the network layer, rather than mocking `axios/fetch` directly.

## Best Practices

-   **Queries:** Prefer `getByRole`, then `getByLabelText`, then `getByText`. Avoid `getByTestId` unless necessary.
-   **Async:** Always use `await screen.findBy...` for async elements.
-   **Hooks:** Use `renderHook` from `@testing-library/react` to test hooks in isolation.
