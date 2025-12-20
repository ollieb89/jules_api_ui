# Jules Angular 21 Patterns & Best Practices
**Date**: 2025-01-20  
**Context**: Patterns established during core features implementation

## Angular 21 Modern Patterns

### Control Flow Syntax
- **Use**: `@if`, `@for`, `@switch`, `@else` (new syntax)
- **Avoid**: `*ngIf`, `*ngFor`, `*ngSwitch` (legacy)
- **Example**:
```typescript
@if (loading()) {
  <div>Loading...</div>
} @else {
  <div>Content</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

### Signals for State Management
- **Use**: `signal()` for state, `computed()` for derived state
- **Avoid**: `BehaviorSubject` for simple state (use RxJS only for HTTP)
- **Pattern**:
```typescript
loading = signal<boolean>(false);
items = signal<Item[]>([]);
filteredItems = computed(() => {
  return this.items().filter(/* ... */);
});
```

### Standalone Components
- **All components are standalone**: No NgModule needed
- **Import pattern**: Import only what's needed in component
- **Example**:
```typescript
@Component({
  selector: 'app-example',
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true,
  // ...
})
```

### Change Detection
- **Always use**: `ChangeDetectionStrategy.OnPush`
- **Benefits**: Better performance, explicit change detection
- **Requires**: Signals or proper change detection triggers

## Tailwind CSS Patterns

### Dark Mode
- **Pattern**: Use `dark:` prefix for all dark mode styles
- **Example**: `bg-white dark:bg-gray-800`
- **Theme Control**: `.dark` class on `<html>` element

### Responsive Design
- **Mobile-first**: Base styles for mobile, then `md:`, `lg:` breakpoints
- **Grid Layouts**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Color System
- **Primary**: `blue-600` / `blue-500` (dark)
- **Success**: `green-600` / `green-500`
- **Warning**: `yellow-600` / `yellow-500`
- **Error**: `red-600` / `red-500`
- **Neutral**: `gray-*` scale

## Service Patterns

### HTTP Services
- **Pattern**: Use RxJS Observables for HTTP calls
- **Error Handling**: Centralized `handleError` method
- **Type Safety**: Full TypeScript interfaces for all API responses

### State Services
- **Pattern**: Use signals for reactive state
- **Computed Properties**: Use `computed()` for derived state
- **Example**: `SessionCacheService` with filtered/sorted computed signals

## Component Patterns

### Form Handling
- **Reactive Forms**: Use `FormBuilder`, `FormGroup`, `ReactiveFormsModule`
- **Validation**: Validators in form definition
- **Access**: `get()` method for form controls

### Template Patterns
- **Inline Templates**: For simple components, use inline `template` property
- **Separate Files**: For complex templates, use `templateUrl`
- **Track Functions**: Always use `track` in `@for` loops

### Accessibility
- **ARIA Labels**: Always include `aria-label` on interactive elements
- **Live Regions**: Use `aria-live` for dynamic content
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible

## Backend Integration Patterns

### Django REST Framework
- **ViewSets**: Use ViewSets with custom actions for complex endpoints
- **Serializers**: Handle camelCase from external API, convert to snake_case
- **Error Responses**: Consistent error format with status codes

### API Client Pattern
- **Service Layer**: `JulesApiClient` abstracts external API calls
- **Error Handling**: Catch exceptions, return structured error responses
- **Type Hints**: Full type hints for MyPy compliance

## Performance Patterns

### Debouncing
- **Search**: 300ms debounce for search inputs
- **Implementation**: `setTimeout` with cleanup in component

### Caching
- **Client-Side**: Cache all sessions in service for filtering/sorting
- **Max Items**: Limit to 1000 items, show "Load More" if needed

### Change Detection
- **OnPush**: All components use OnPush for better performance
- **Signals**: Signals trigger change detection automatically

## Security Patterns

### API Key Storage
- **Never Display**: Never show plaintext API keys
- **Masking**: Show only first 4 + last 4 characters
- **Storage**: Use database with encoding (upgrade to encryption for production)

### Input Validation
- **Frontend**: Form validators for user input
- **Backend**: Serializer validation for API requests
- **Error Messages**: User-friendly error messages

## Testing Considerations

### Testable Code
- **Services**: Fully injectable, no direct API calls in components
- **Pure Functions**: Sorting/filtering logic in pure functions
- **No Global State**: Avoid global state or side effects

### Component Testing
- **Isolated**: Components testable in isolation
- **Mocks**: Services can be easily mocked
- **Signals**: Signals are testable without complex setup
