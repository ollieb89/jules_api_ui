# Checkpoint: Backend Architecture Correction

**Summary**
Corrected project documentation to reflect that `jules_backend` is built with **Django 5** and **DRF**, not FastAPI.

**Actions Taken**
1.  **`.gemini-flow/gemini-flow-integration.md`**: Updated to use Django-specific agents (`django-dev`), commands (`pixi run runserver`, `migrate`), and workflows.
2.  **`GEMINI.md`**: Updated the Source of Truth to correctly list Django, Psycopg 3, and Django Migrations as the backend stack.

**Current State**
-   **Frontend**: Angular 21 (Bun) @ 4700.
-   **Backend**: Django 5 (Pixi) @ 8444.

**Notes for Agents**
-   Use `django-dev` for backend tasks.
-   Use `pixi run <command>` for all backend operations.
