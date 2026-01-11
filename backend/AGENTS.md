# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Django project settings, URL routing, and WSGI/ASGI entry points.
- `users/`, `jules/`: Django apps providing API endpoints and domain logic.
- `tests/`: Pytest suite (`test_*.py`).
- `pixi.toml`: backend tooling configuration.

## Architecture Overview
- Django entry points are `manage.py` for development and `backend/wsgi.py` for production.
- API layers are split into Django apps (`users`, `jules`) with DRF serializers for validation.
- Database evolution is managed through Django migrations.

## Build, Test, and Development Commands
Run commands from `backend/`.
- `pixi run runserver`: start dev API server on `:8444`.
- `pixi run migrate`: apply database migrations.
- `pixi run makemigrations`: create a new migration.
- `pixi run pytest`: run the test suite.
- `pixi run black . && pixi run ruff . && pixi run mypy .`: format, lint, and type-check.

## Coding Style & Naming Conventions
- Python code is formatted with Black and linted with Ruff; type hints are required and checked by MyPy.
- Use `snake_case` for variables/functions and `PascalCase` for Django models/DRF serializers.
- Prefer clear module names and keep files focused (e.g., `users/views.py`).

## Testing Guidelines
- Tests live in `tests/` and follow `test_*.py` naming.
- Use Pytest; async route tests should use HTTPX.
- Cover new routes, schemas, and database behavior. Add migration tests when schema changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history.
- PRs should include intent, key changes, and tests run. Link issues or plans and note migration impacts.

## Security & Configuration Tips
- Do not commit secrets. Copy `backend/.env.example` to `.env` locally.
- Validate inputs at schema boundaries and use parameterized queries via Django ORM.
