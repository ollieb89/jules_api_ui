# Jules Backend

This directory contains the backend source code for the Jules application (`jules_backend`). It
serves as the Django REST API provider for the frontend system.

## Project Structure

- **`jules_backend/`**: Django project settings, URLs, and WSGI/ASGI entry points.
- **`users/`, `jules/`**: Django apps that provide API endpoints and domain logic.
- **`tests/`**: Pytest test suite.
- **`pixi.toml`**: Dependency and environment configuration.

## Tech Stack

- **Framework:** Django 5 + Django REST Framework
- **Language:** Python 3.11+
- **Database:** PostgreSQL (using Django ORM & Psycopg driver)
- **Migrations:** Django migrations
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
  Runs the Django development server.
  ```bash
  pixi run runserver
  ```
  - API Base URL: `http://localhost:8444`

- **Database Migrations:**
  - **Apply Migrations:**
    ```bash
    pixi run migrate
    ```
  - **Create New Migration:**
    ```bash
    pixi run makemigrations
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
- **API Layers:** Use DRF serializers for validation and viewsets for routing.
