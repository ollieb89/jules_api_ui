# Jules API (Frontend) Context

This `GEMINI.md` file provides essential context and instructions for AI agents working on the `frontend` project.

## 1. Project Overview

`frontend` is a modern Angular frontend application serving as the user interface for the Jules system. It uses Angular 21+, Tailwind CSS 4, and is built for Server-Side Rendering (SSR).

### Tech Stack

- **Framework:** Angular 21.0.4
- **Language:** TypeScript 5.9.2 (Strict Mode)
- **Runtime/Package Manager:** Bun 1.3.5
- **Styling:** Tailwind CSS 4.1.12
- **Builder:** `@angular/build:application` (esbuild-based)
- **Testing:** Vitest 4.0.8 (via `@angular/build:unit-test`)
- **Server:** Express (for SSR)

## 2. Development Workflow & Commands

**Note:** Use `bun` for all package management and script execution.

- **Install Dependencies:**

  ```bash
  bun install
  ```

- **Start Development Server:**
  Runs on port **4700**.

  ```bash
  bun run start
  # Equivalent to: ng serve --port 4700
  ```

- **Build for Production:**
  Outputs to `dist/frontend/`.

  ```bash
  bun run build
  ```

- **Run Unit Tests:**
  Uses Vitest.
  ```bash
  bun run test
  ```

## 3. Architecture & Coding Conventions

### Angular Best Practices (v21+)

- **Standalone Components:** All components, directives, and pipes must be standalone. Do NOT use `NgModules`.
- **Signals:** Use Angular Signals for all local state management.
  - Use `signal()` for writable state.
  - Use `computed()` for derived state.
  - Use `input()` and `output()` for component communication.
- **Control Flow:** Use the new built-in control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives (`*ngIf`, `*ngFor`).
- **Change Detection:** Always use `ChangeDetectionStrategy.OnPush`.

### Styling

- **Tailwind CSS:** Use Tailwind utility classes for styling.
- **Configuration:** Tailwind is configured via `@tailwindcss/postcss` and `postcss`.
- **Files:** Global styles are in `src/styles.css`. Component styles should be minimal or use Tailwind classes directly in the template where appropriate, or in the component's CSS file.

### Server-Side Rendering (SSR)

- The application is configured for SSR with hydration.
- Be mindful of code that accesses browser-specific APIs (like `window`, `document`, `localStorage`).
- Wrap browser-only code in `afterNextRender` or checks for `isPlatformBrowser`.

### Type Safety

- **Strict Mode:** TypeScript `strict` mode is enabled.
- **Strict Templates:** Angular `strictTemplates` is enabled.
- **No `any`:** Avoid `any`. Use `unknown` or specific types.

## 4. Key Configuration Files

- `package.json`: Dependency management and scripts.
- `angular.json`: Workspace configuration, build options, and asset management.
- `tsconfig.json` & `tsconfig.app.json`: TypeScript configuration.
- `src/app/app.routes.ts`: Application routing configuration.
- `src/app/app.config.ts`: Global application configuration (providers).

## 5. Directory Structure

- `src/`: Source code.
  - `app/`: Main application logic.
  - `public/`: Static assets (images, icons).
  - `server.ts`: Express server entry point for SSR.
  - `main.ts`: Browser entry point.
  - `main.server.ts`: Server entry point.
