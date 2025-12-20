# Repository Guidelines

## Project Structure & Modules
- `jules_api/`: Angular 21 frontend (SSR) using Bun. Source in `src/`, public assets in `public/`, builds land in `dist/`. Follows standalone components and signals.
- `jules_backend/`: FastAPI service. App code in `app/` (routes, models, schemas, config), migrations in `migrations/`, tests in `tests/`.
- `docs/plans/`: Planning and design notes. Update or add a new plan file when changing scope.

## Build, Test, and Development Commands
Run commands from the target subproject directory.

**Frontend (Bun):**
```bash
bun install          # install deps
bun run start        # dev server on :4700 (SSR-ready)
bun run build        # production build to dist/jules_api
bun run test         # Vitest unit tests
```

**Backend (Pixi):**
```bash
pixi run uvicorn app.main:app --reload   # dev server on :8444
pixi run alembic upgrade head            # apply migrations
pixi run alembic revision --autogenerate -m "msg"  # create migration
pixi run pytest                          # test suite
pixi run black . && pixi run ruff . && pixi run mypy .  # formatting/lint/type-check
```

## Coding Style & Naming
- Frontend: TypeScript strict mode; Prettier (100 char width, single quotes). Prefer standalone components, signals, and `ChangeDetectionStrategy.OnPush`; use new control-flow syntax (`@if`, `@for`). Keep styles in Tailwind utility classes.
- Backend: Black formatting and Ruff linting; type hints checked by MyPy. Use snake_case for Python, PascalCase for Pydantic models, and descriptive file/module names.

## Testing Guidelines
- Frontend: Place spec files near components; mock browser-only APIs in SSR paths. Ensure new signals/computed state have unit coverage.
- Backend: Pytest tests live in `tests/` with `test_*.py` naming. Cover new routes, schemas, and DB behaviors; use HTTPX for async client tests. Add migration tests when schema changes.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits (e.g., `feat:`, `fix:`) as seen in history. Keep changes scoped and readable.
- PRs should describe intent, key changes, and testing performed. Link issues or plans, include screenshots/GIFs for UI-affecting changes, and note migration impacts. Update docs when behavior or APIs change.

## Security & Configuration
- Do not commit secrets; copy `jules_backend/.env.example` to `.env` locally. Confirm DB credentials before running migrations.
- In SSR frontend code, guard browser-only APIs with platform checks. In backend, validate inputs at schema boundaries and prefer parameterized queries via SQLAlchemy.
