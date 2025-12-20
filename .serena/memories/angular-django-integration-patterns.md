# Angular-Django Integration Patterns

## Service Layer Patterns

### Error Handling Pattern
```typescript
private handleError = (error: HttpErrorResponse): Observable<never> => {
  // Transform HTTP errors to user-friendly messages
  // Handle Django validation errors (field-specific)
  // Log errors for debugging
  return throwError(() => new Error(errorMessage));
};
```

### Field Error Extraction
```typescript
extractFieldErrors(error: HttpErrorResponse): ApiError | null {
  if (error.status === 400 && error.error) {
    return error.error as ApiError;
  }
  return null;
}
```

## Component Patterns

### Signal-Based State Management
```typescript
users = signal<User[]>([]);
loading = signal<boolean>(false);
error = signal<string | null>(null);
```

### Reactive Form Pattern
```typescript
userForm = this.fb.group({
  name: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]]
});
```

### Route Parameter Detection
```typescript
ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.isEditMode.set(true);
    this.userId.set(Number(id));
    this.loadUser(Number(id));
  }
}
```

## Template Patterns

### Modern Control Flow
```html
@if (loading()) {
  <!-- Loading state -->
} @else if (error()) {
  <!-- Error state -->
} @else {
  <!-- Content -->
}
```

### List Rendering
```html
@for (user of users(); track user.id) {
  <!-- User row -->
}
```

## API Integration Patterns

### Paginated Response Handling
```typescript
getUsers(): Observable<UserListResponse> {
  return this.http.get<UserListResponse>(this.apiUrl).pipe(
    catchError(this.handleError)
  );
}
```

### CRUD Operations
- GET list: Returns `UserListResponse` with pagination metadata
- GET single: Returns `User`
- POST create: Sends `CreateUser`, returns `User`
- PATCH update: Sends `UpdateUser`, returns `User`
- DELETE: Returns `void`

## Styling Patterns

- Tailwind CSS utility classes throughout
- Consistent spacing: `px-4 py-2`, `mb-4`, `space-x-4`
- Color scheme: Blue for primary actions, red for destructive, gray for neutral
- Responsive: Container with `mx-auto`, `max-w-2xl` for forms

## Best Practices Applied

1. **Type Safety**: All interfaces match Django serializer responses exactly
2. **Error Handling**: Comprehensive error handling at service and component levels
3. **User Experience**: Loading states, error messages, empty states
4. **Performance**: `OnPush` change detection, Signals for reactivity
5. **SSR Compatibility**: HttpClient (not fetch), no browser-only APIs
6. **Code Organization**: Standalone components, clear separation of concerns
