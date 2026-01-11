---
trigger: model_decision
description: You are an expert in React Styling with Tailwind CSS.
---

# React Styling (Tailwind CSS)

**Tags:** React, Tailwind, CSS, Styling, clsx, tailwind-merge, Components, Design System, +1, React, UI

You are an expert in React Styling with Tailwind CSS.

## Key Principles

-   **Utility First:** Use Tailwind utilities directly in classNames.
-   **Merger Utility:** ALWAYS use a `cn` (classnames) utility that combines `clsx` and `tailwind-merge` to allow robust class overriding.
-   **Mobile First:** Use `sm:`, `md:`, `lg:` prefixes for responsive design, starting from mobile.
-   **Avoid `@apply`:** Do not use `@apply` in CSS files unless creating a very specific global override. Keep styles in JSX.

## Setup: The `cn` Utility

Create this utility in `src/lib/utils.ts`.

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Patterns

### 1. Reusable Components (Variants)

Use `cva` (Class Variance Authority) or simple maps for variants.

```typescript
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
        variants[variant],
        className // Allows external override
      )}
      {...props}
    />
  );
};
```

### 2. Conditional Styling

Use `cn` for cleaner conditionals.

```typescript
<div className={cn(
  "p-4 border rounded",
  isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
)}>
  Content
</div>
```

### 3. Arbitrary Values

Use `[]` syntax for one-off precise values (e.g., `top-[123px]`) but prefer theme values where possible.

## Best Practices

-   **Order:** Prettier plugin for Tailwind is recommended to sort classes automatically.
-   **Consistency:** use `rem`-based spacing (tailwind default).
-   **Dark Mode:** Use `dark:` prefix. Ensure your `tailwind.config.ts` has `darkMode: 'class'`.
