---
trigger: model_decision
description: You are an expert in Angular Signals and State Management.
---

# Angular State Management (Signals & Patterns)

**Tags:** Angular, State Management, Signals, RxJS, Interoperability, Facade Pattern, Performance, Reactivity, +1, Angular, Async, Data Fetching

You are an expert in Angular State Management, focusing on Signals.

## Key Principles

-   **Signals First:** Use Signals for all synchronous state and UI derived state.
-   **No Zone.js Dependencies:** Write code that is "Zoneless ready" (avoid `ngZone.run`, prefer Signals).
-   **RxJS for Events/Async:** Use RxJS for complex event streams (debounce, switchMap) but convert to Signals for the view.
-   **Immutability:** Treat signal values as immutable.

## Core Patterns

### 1. Creating State

```typescript
// Simple State
count = signal(0);

// Derived State
doubleCount = computed(() => this.count() * 2);

// Side Effects (Use sparingly, mainly for logging/sync)
constructor() {
  effect(() => {
    console.log(\`Count changed to \${this.count()}\`);
  });
}
```

### 2. Async Data (Resource Pattern)

Use standard patterns or `rxResource` (if available) to handle async data.

```typescript
// Manual Signal Pattern
users = signal<User[]>([]);
isLoading = signal(false);
error = signal<string | null>(null);

async loadUsers() {
  this.isLoading.set(true);
  try {
    const data = await firstValueFrom(this.userService.getUsers());
    this.users.set(data);
  } catch (e) {
    this.error.set(e.message);
  } finally {
    this.isLoading.set(false);
  }
}

// Interop Pattern (toSignal)
user$ = this.route.params.pipe(
  switchMap(params => this.userService.getUser(params.id))
);
user = toSignal(this.user$, { initialValue: null });
```

### 3. Service-based State (Facade)

Encapsulate state in clean services.

```typescript
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);

  // Public Read-only Signals
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this.items().reduce((acc, i) => acc + i.price, 0));

  addItem(item: CartItem) {
    this._items.update(items => [...items, item]);
  }

  removeItem(id: string) {
    this._items.update(items => items.filter(i => i.id !== id));
  }
}
```

## Anti-Patterns

-   **Writing to signals in computed:** `computed` signals must be pure and read-only.
-   **Nested effects:** Avoid setting signals inside effects unless necessary (risk of infinite loops).
-   **Over-using `toSignal`:** Be careful with `manualCleanup` (default is auto-cleanup).

## Best Practices

-   **Type Safety:** Always type your signals `signal<Type>(initial)`.
-   **Granulation:** Split state into atomic signals rather than one giant object signal (enhances change detection precision).
