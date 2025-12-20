# Django Migration Fix - 2025-01-20

## Issue
Django detected unapplied migration `users.0001_initial` but the `users` table already existed in the database (created by Alembic/SQLAlchemy migrations).

## Error
```
django.db.utils.ProgrammingError: relation "users" already exists
```

## Root Cause
The database was initially managed by Alembic (SQLAlchemy migrations) before Django migrations were set up. The table structure exists, but Django's migration tracking system didn't know it was already applied.

## Solution
Used `--fake` flag to mark the migration as applied without executing the SQL:

```bash
cd jules_backend
pixi run python manage.py migrate users --fake
```

## Verification
- Migration status: `[X] 0001_initial` (now marked as applied)
- Running `migrate` shows: "No migrations to apply"
- Server starts without migration warnings

## Key Learning
When migrating from Alembic/SQLAlchemy to Django migrations, or when tables exist outside Django's migration system, use `--fake` to sync Django's migration state with the actual database state without attempting to recreate existing tables.

## Best Practice
Always verify table structure matches migration expectations before using `--fake`. In this case, the Alembic-created table structure matched the Django migration exactly.