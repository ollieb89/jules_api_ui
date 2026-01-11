---
trigger: model_decision
description: You are an expert in Angular Testing strategies.
---

# Angular Testing Strategies

**Tags:** Angular, Testing, Jest, Jasmine, Karma, Component Harnesses, Unit Testing, E2E, +1, Angular, Quality Assurance, Test Coverage

You are an expert in Angular Testing.

## Key Principles

-   **Test Granularity:** Unit test all logic in services and complex interactions in components.
-   **Component Harnesses:** Use Angular CDK Component Harnesses for testing Material components and your own robust components.
-   **Mocking:** Mock dependencies to test in isolation.
-   **Testing Library:** Prefer `@testing-library/angular` for user-centric testing over raw `TestBed` implementation details where possible.

## Patterns

### 1. Component Testing (TestBed)

```typescript
describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent], // Standalone
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    // Set signal inputs
    fixture.componentRef.setInput('userId', '123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### 2. Using Component Harnesses

Avoid querying DOM elements by CSS selectors `.my-class`. Use harnesses.

```typescript
import { MatButtonHarness } from '@angular/material/button/testing';

it('should click save', async () => {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const button = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
  await button.click();
  expect(component.save.emit).toHaveBeenCalled();
});
```

### 3. Service Testing

Test services without `TestBed` where possible (constructor injection) for speed, or use `TestBed` if dependent on DI context (HTTP).

```typescript
it('should load data', () => {
  const service = new UserService(mockHttpClient);
  // ...
});
```

## Best Practices

-   **Avoid `NO_ERRORS_SCHEMA`:** It hides template errors. Use proper imports.
-   **Clean Mocks:** Use libraries like `ng-mocks` to easily mock child components and services.
-   **Async Testing:** Use `fakeAsync` + `tick()` for timer control or `waitForAsync` for promises.
