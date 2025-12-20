# Jules Project

This repository contains the source code for the Jules application, consisting of an Angular frontend (`jules_api`) and a Django backend (`jules_backend`).

## Project Structure

- **`jules_api/`**: Angular 21+ frontend application.
- **`jules_backend/`**: Django backend application using Pixi for environment management.
- **`docs/`**: Project documentation.
- **`.agent/`**: AI agent rules and context.

## Prerequisites

- **Node.js / Bun**: For the frontend (`bun` is specified in `package.json`).
- **Pixi**: For the backend environment and task management.

## 1. Jules API (Frontend)

Located in `jules_api/`.

### Tech Stack

- **Framework:** Angular 21.0.4
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Testing:** Vitest
- **Package Manager:** Bun

### Development Commands

Run these commands from the `jules_api/` directory:

- **Start Development Server:**

  ```bash
  bun run start
  # OR
  ng serve --port 4700
  ```

  App available at: `http://localhost:4700/`

- **Build:**

  ```bash
  bun run build
  ```

- **Test:**

  ```bash
  bun run test
  ```

- **Lint/Format:**
  Prettier is configured.

## 2. Jules Backend

Located in `jules_backend/`.

### Tech Stack

- **Framework:** Django 5 + Django REST Framework
- **Language:** Python 3.11
- **Database:** PostgreSQL (via Psycopg 3)
- **Migrations:** Django Migrations
- **Environment Manager:** Pixi

### Development Commands

Run these commands from the `jules_backend/` directory (or use `pixi run -m jules_backend ...` if supported):

- **Setup Environment:**

  ```bash
  cp .env.example .env
  # Edit .env with your database credentials
  ```

- **Start Server:**

  ```bash
  pixi run runserver
  ```

  API available at: `http://localhost:8444`

- **Database Migrations:**

  ```bash
  # Apply migrations
  pixi run migrate

  # Create new migration
  pixi run makemigrations
  ```

- **Test:**

  ```bash
  pixi run test
  ```

- **Code Quality:**
  - **Format:** `black`
  - **Lint:** `ruff`
  - **Type Check:** `mypy`

## Development Workflow

1.  **Backend First:** Ensure the backend is running and the database is migrated.
2.  **Frontend Second:** Start the Angular dev server.
3.  **Port Conflicts:** Note that the frontend runs on port **4700** and the backend on **8444**. Ensure these ports are free.
