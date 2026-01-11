# Jules Backend API

Django + Django REST Framework backend for Jules.

## Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/jules_db
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
JULES_API_KEY=your-jules-api-key-here
```

### 2. Database Migrations

Initialize database schema:

```bash
pixi run migrate
```

Create a new migration (after modifying models):

```bash
pixi run makemigrations
pixi run migrate
```

### 3. Run the Server

Start the Django development server:

```bash
pixi run runserver
```

The API will be available at [http://localhost:8444](http://localhost:8444).

API endpoints:
- Health check: [http://localhost:8444/health](http://localhost:8444/health)
- Users API: [http://localhost:8444/api/users/](http://localhost:8444/api/users/)
- Jules API: [http://localhost:8444/api/jules/](http://localhost:8444/api/jules/)
  - Jules Health: [http://localhost:8444/api/jules/health/](http://localhost:8444/api/jules/health/)
  - Sources: [http://localhost:8444/api/jules/sources/](http://localhost:8444/api/jules/sources/)
  - Sessions: [http://localhost:8444/api/jules/sessions/](http://localhost:8444/api/jules/sessions/)
- Admin panel: [http://localhost:8444/admin/](http://localhost:8444/admin/)

### 4. Testing

Run the test suite:

```bash
pixi run test
```

### 5. Code Quality

Format and lint code:

```bash
pixi run format
```

Type checking:

```bash
pixi run typecheck
```

## Development Commands

- `pixi run runserver` - Start Django development server
- `pixi run migrate` - Apply database migrations
- `pixi run makemigrations` - Create new migrations
- `pixi run shell` - Open Django shell
- `pixi run test` - Run tests
- `pixi run format` - Format code with black and ruff
- `pixi run typecheck` - Run mypy type checking

## API Documentation

Django REST Framework provides browsable API documentation. Visit any API endpoint in your browser to see the interactive API documentation.

## Project Structure

```
backend/
├── manage.py              # Django management script
├── backend/         # Django project settings
│   ├── settings.py        # Django configuration
│   ├── urls.py           # Main URL routing
│   └── health/           # Health check endpoint
├── users/                 # Users Django app
│   ├── models.py         # User model
│   ├── serializers.py   # DRF serializers
│   ├── views.py         # API views/viewsets
│   └── urls.py          # App URL routing
└── tests/                # Test suite
```
