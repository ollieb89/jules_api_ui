# Repository Guidelines

## Project Structure & Module Organization
- `app/`: FastAPI application code (routes, models, schemas, config).
- `migrations/`: Alembic migration scripts.
- `tests/`: Pytest suite (`test_*.py`).
- `alembic.ini`, `pixi.toml`: backend tooling configuration.

## Architecture Overview
- FastAPI app entry point is `app/main.py`, wiring routers and configuration.
- API layers are split into routes, schemas, and models; prefer validation at the schema layer.
- Database evolution is managed through Alembic in `migrations/`.

## Build, Test, and Development Commands
Run commands from `jules_backend/`.
- `pixi run uvicorn app.main:app --reload`: start dev API server on `:8444`.
- `pixi run alembic upgrade head`: apply database migrations.
- `pixi run alembic revision --autogenerate -m "msg"`: create a new migration.
- `pixi run pytest`: run the test suite.
- `pixi run black . && pixi run ruff . && pixi run mypy .`: format, lint, and type-check.

## Coding Style & Naming Conventions
- Python code is formatted with Black and linted with Ruff; type hints are required and checked by MyPy.
- Use `snake_case` for variables/functions and `PascalCase` for Pydantic models.
- Prefer clear module names and keep files focused (e.g., `app/routes/users.py`).

## Testing Guidelines
- Tests live in `tests/` and follow `test_*.py` naming.
- Use Pytest; async route tests should use HTTPX.
- Cover new routes, schemas, and database behavior. Add migration tests when schema changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history.
- PRs should include intent, key changes, and tests run. Link issues or plans and note migration impacts.

## Security & Configuration Tips
- Do not commit secrets. Copy `jules_backend/.env.example` to `.env` locally.
- Validate inputs at schema boundaries and use parameterized queries via SQLAlchemy.
