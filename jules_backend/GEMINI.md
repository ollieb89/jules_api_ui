# Jules Backend

This directory contains the backend source code for the Jules application (`jules_backend`). It serves as the API provider for the frontend system.

## Project Structure

- **`app/`**: Core application logic.
    - **`main.py`**: The entry point for the FastAPI application.
    - **`models/`**: SQLAlchemy database models.
    - **`schemas/`**: Pydantic schemas for data validation and serialization.
    - **`routes/`**: API route definitions.
    - **`config.py`**: Configuration management using Pydantic Settings.
    - **`database.py`**: Database connection and session management.
- **`migrations/`**: Alembic migration scripts.
- **`tests/`**: Pytest test suite.
- **`pixi.toml`**: Dependency and environment configuration.

## Tech Stack

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **Database:** PostgreSQL (using SQLAlchemy ORM & Psycopg driver)
- **Migrations:** Alembic
- **Environment & Package Management:** Pixi
- **Testing:** Pytest, HTTPX

## Development

### Prerequisites

- **Pixi**: This project uses [Pixi](https://pixi.sh/) for environment management. Ensure it is installed.
- **PostgreSQL**: A running PostgreSQL instance is required.

### Setup

1.  **Environment Variables:**
    Copy the example configuration and update it with your local settings (specifically database credentials).
    ```bash
    cp .env.example .env
    ```

2.  **Dependencies:**
    Pixi handles dependency installation automatically when running commands.

### Key Commands

All commands are run using `pixi run` to ensure they execute within the project's environment.

- **Start Development Server:**
  Runs the server with hot-reload enabled.
  ```bash
  pixi run uvicorn app.main:app --reload
  ```
  - API Base URL: `http://localhost:8444`
  - Swagger UI: `http://localhost:8444/docs`

- **Database Migrations:**
  - **Apply Migrations (Upgrade):**
    ```bash
    pixi run alembic upgrade head
    ```
  - **Create New Migration:**
    Generates a migration script based on changes in `app/models`.
    ```bash
    pixi run alembic revision --autogenerate -m "your_migration_message"
    ```

- **Testing:**
  Runs the test suite using Pytest.
  ```bash
  pixi run pytest
  ```

- **Code Quality:**
  The project includes tools for formatting and linting.
  - **Format Code:** `pixi run black .`
  - **Lint:** `pixi run ruff .`
  - **Type Check:** `pixi run mypy .`

## Conventions

- **Code Style:** Follows `black` formatting and `ruff` linting rules.
- **Type Hinting:** Strict type hinting is encouraged and checked via `mypy`.
- **Async:** The application is asynchronous; use `async/await` for database operations and route handlers.
