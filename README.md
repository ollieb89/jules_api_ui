# Jules API UI

A full-stack application for managing tasks and code reviews with AI-powered automation. Jules combines an Angular 21 frontend with server-side rendering (SSR) and a Django backend to provide a modern, responsive interface for task management and GitHub integration.

## 🎯 Project Overview

Jules API UI is a comprehensive task management and code review platform that integrates with AI coding agents to automate development workflows. The application features:

- **Modern Frontend**: Angular 21 with SSR, standalone components, and signals
- **Robust Backend**: Django REST Framework with PostgreSQL
- **Real-time Updates**: WebSocket support for live task status
- **GitHub Integration**: OAuth, PRs, and code review workflows
- **Design System**: Custom color tokens and accessible component library
- **AI-Powered**: Integration with Jules coding agent for automated tasks

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)

## 🏗️ Project Structure

```
jules_api_ui/
├── jules_api/          # Angular 21 frontend (SSR with Bun)
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   ├── dist/          # Build output
│   └── package.json   # Frontend dependencies
│
├── jules_backend/      # Django backend (Pixi)
│   ├── migrations/    # Database migrations
│   ├── tests/         # Backend tests
│   ├── pixi.toml      # Python dependencies and tasks
│   └── manage.py      # Django management script
│
├── docs/              # Documentation
│   ├── plans/         # Architecture and design documents
│   ├── ACCESSIBILITY.md
│   └── COLOR_SYSTEM.md
│
├── AGENTS.md          # Repository guidelines for agents
├── GEMINI.md          # Gemini integration notes
└── README.md          # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Frontend Requirements
- **Bun**: v1.3.5 or higher ([Install Bun](https://bun.sh/))
- **Node.js**: v20.x or higher (for compatibility)

### Backend Requirements
- **Pixi**: Latest version ([Install Pixi](https://prefix.dev/docs/pixi/overview))
- **Python**: 3.11.x (managed by Pixi)
- **PostgreSQL**: 14+ (local or remote)

### Optional Tools
- **Git**: For version control
- **Docker**: For containerized development (optional)
- **VS Code**: Recommended IDE with Angular and Python extensions

## 🚀 Quick Start

Get the entire application running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/ollieb89/jules_api_ui.git
cd jules_api_ui

# 2. Start the backend
cd jules_backend
cp .env.example .env
# Edit .env with your database credentials
pixi run migrate
pixi run runserver  # Runs on http://localhost:8444

# 3. In a new terminal, start the frontend
cd jules_api
bun install
bun run start  # Runs on http://localhost:4700
```

Visit **http://localhost:4700** to see the application!

## 🎨 Frontend Setup

The frontend is an Angular 21 application with SSR support, using Bun as the package manager.

### Installation

```bash
cd jules_api
bun install
```

### Development Commands

```bash
# Start development server (port 4700)
bun run start

# Build for production
bun run build

# Run unit tests
bun run test

# Watch mode for development
bun run watch

# Serve SSR build
bun run serve:ssr:jules_api
```

### Frontend Architecture

- **Framework**: Angular 21
- **Styling**: Tailwind CSS v4.1
- **Testing**: Angular Testing Framework with Vitest integration
- **Package Manager**: Bun 1.3.5
- **SSR**: Angular SSR with Express
- **Components**: Standalone components with signals
- **State Management**: Angular signals and services
- **HTTP**: Angular HttpClient

### Key Features

- **Server-Side Rendering (SSR)**: Improved SEO and initial load performance
- **Standalone Components**: Modern Angular architecture without NgModules
- **Signals**: Reactive state management with Angular signals
- **Control Flow**: New `@if`, `@for`, `@switch` syntax
- **Tailwind v4**: Utility-first CSS framework
- **Change Detection**: OnPush strategy for optimized performance

### Frontend Configuration

Edit `jules_api/src/environments/environment.ts` for development and `environment.production.ts` for production:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8444/api',
  wsUrl: 'ws://localhost:8444/ws'
};
```

## 🔧 Backend Setup

The backend uses Django with Pixi for environment management. A legacy FastAPI prototype has been
archived and is not part of the current runtime.

### Installation

```bash
cd jules_backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

Create a `.env` file in `jules_backend/` with the following:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jules_db

# Application Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Note**: Additional environment variables may be required for Django settings (e.g., `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`) or Jules API integration (e.g., `JULES_API_KEY`) depending on your specific deployment needs.

### Database Setup

```bash
# Run migrations
pixi run migrate

# Create migrations (after model changes)
pixi run makemigrations
pixi run migrate

# Access Django shell
pixi run shell

# Create superuser (optional)
python manage.py createsuperuser
```

### Development Commands

```bash
# Start Django server (port 8444)
pixi run runserver

# Run tests
pixi run test

# Format code
pixi run format

# Type checking
pixi run typecheck

# Collect static files
pixi run collectstatic
```

### Backend Architecture

- **Web Framework**: Django 5
- **API Framework**: Django REST Framework 3.15
- **Database**: PostgreSQL with Psycopg 3
- **ORM**: Django ORM
- **Migrations**: Django Migrations
- **Testing**: Pytest with pytest-django
- **Code Quality**: Black, Ruff, MyPy
- **Environment**: Pixi (conda-forge)

### API Endpoints

**Django Endpoints:**
- Health Check: `http://localhost:8444/health`
- Admin Panel: `http://localhost:8444/admin/`
- Users API: `http://localhost:8444/api/users/`
- Jules API: `http://localhost:8444/api/jules/`
  - Health: `/api/jules/health/`
  - Sources: `/api/jules/sources/`
  - Sessions: `/api/jules/sessions/`

## 🔄 Development Workflow

### Daily Development

1. **Start Backend** (Terminal 1):
   ```bash
   cd jules_backend
   pixi run runserver
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd jules_api
   bun run start
   ```

3. **Make Changes**: Edit files in `src/` directories

4. **Verify Changes**: Check browser at `http://localhost:4700`

### Code Style Guidelines

**Frontend (TypeScript/Angular):**
- Use TypeScript strict mode
- Prefer standalone components
- Use signals for reactive state
- Follow Prettier formatting (100 char width, single quotes)
- Use new control-flow syntax (`@if`, `@for`)
- Apply Tailwind utility classes for styling
- Implement `ChangeDetectionStrategy.OnPush`

**Backend (Python):**
- Use type hints (checked by MyPy)
- Follow Black formatting
- Lint with Ruff
- Use snake_case for functions/variables
- Use PascalCase for DRF serializers and Django model classes
- Parameterized queries only
- Validate inputs at schema boundaries

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Make changes and commit (Conventional Commits)
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feat/your-feature-name
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 🧪 Testing

### Frontend Tests

```bash
cd jules_api

# Run all tests
bun run test

# Watch mode
bun run test --watch

# Coverage report
bun run test --coverage
```

**Test Guidelines:**
- Place spec files next to components (`*.spec.ts`)
- Mock browser-only APIs for SSR
- Test signals and computed state
- Use Angular TestBed for component tests

### Backend Tests

```bash
cd jules_backend

# Run all tests
pixi run test

# Run specific test file
pixi run pytest tests/test_users.py

# With coverage
pixi run pytest --cov=users --cov=jules tests/

# Verbose output
pixi run pytest -v
```

**Test Guidelines:**
- Use `test_*.py` naming convention
- Cover new routes and schemas
- Test database behaviors
- Use HTTPX for async client tests
- Add migration tests for schema changes

## ✅ Code Quality

### Frontend Linting & Formatting

```bash
cd jules_api

# Prettier is configured automatically (format on save in most IDEs)
# Formatting rules are defined in package.json
```

### Backend Linting & Formatting

```bash
cd jules_backend

# Format and lint code (runs both black and ruff)
pixi run format

# Type check with MyPy
pixi run typecheck
```

### Pre-commit Hooks

Pre-commit is available in the backend for running checks automatically:

```bash
cd jules_backend
pre-commit install
pre-commit run --all-files
```

## 🚀 Deployment

### Frontend Deployment

The frontend can be deployed to various platforms:

**Build for Production:**
```bash
cd jules_api
bun run build
```

The build artifacts will be in `dist/jules_api/`.

**Deployment Options:**
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Deploy the `dist/` directory
- **AWS S3 + CloudFront**: Static hosting with CDN
- **Custom Server**: Use the SSR build with `bun run serve:ssr:jules_api`

**Environment Variables** (Production):
Set these in your deployment platform:
- `API_URL`: Backend API URL
- `WS_URL`: WebSocket URL (if applicable)

### Backend Deployment

**Build for Production:**
```bash
cd jules_backend
pixi run collectstatic
```

**Deployment Options:**
- **Docker**: Use provided Dockerfile (if available)
- **Heroku**: Add `Procfile` and deploy
- **AWS EC2/ECS**: Deploy with Gunicorn
- **Google Cloud Run**: Containerized deployment
- **Railway**: Quick deployment with PostgreSQL

**Production Server:**
```bash
# Django with Gunicorn
gunicorn jules_backend.wsgi:application --bind 0.0.0.0:8444
```

**Environment Variables** (Production):
- Set `DEBUG=False`
- Use strong `DJANGO_SECRET_KEY`
- Configure `ALLOWED_HOSTS`
- Use production database URL
- Set proper `CORS_ORIGINS`

## 📚 Documentation

### Additional Documentation

- **[AGENTS.md](AGENTS.md)**: Repository guidelines and coding standards
- **[GEMINI.md](GEMINI.md)**: Gemini integration documentation
- **[docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)**: Accessibility guidelines
- **[docs/COLOR_SYSTEM.md](docs/COLOR_SYSTEM.md)**: Design system colors
- **[docs/plans/](docs/plans/)**: Architecture and planning documents
  - `architecture-tech-stack.md`: Complete architecture overview
  - `component-system.md`: Component specifications
  - `development-roadmap.md`: Implementation timeline
  - `delivery-package-summary.md`: Project delivery guide

### API Documentation

- **Django REST Framework**: Visit `/api/` endpoints in browser for browsable API

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         Angular 21 Frontend             │
│    (SSR, Standalone Components)         │
│         Port: 4700                      │
└───────────────┬─────────────────────────┘
                │ HTTP/REST
                │ WebSocket
┌───────────────▼─────────────────────────┐
│         Django Backend                  │
│    (REST API, WebSockets)               │
│         Port: 8444                      │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         PostgreSQL Database             │
│    (Tasks, Users, Sessions)             │
└─────────────────────────────────────────┘
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feat/amazing-feature`
3. **Make your changes**: Follow code style guidelines
4. **Write tests**: Ensure new features are tested
5. **Run quality checks**:
   ```bash
   # Frontend
   cd jules_api && bun run test
   
   # Backend
   cd jules_backend && pixi run format && pixi run test
   ```
6. **Commit changes**: Use Conventional Commits format
7. **Push to branch**: `git push origin feat/amazing-feature`
8. **Open Pull Request**: Describe your changes

### Pull Request Guidelines

- **Title**: Use Conventional Commits format
- **Description**: Explain what and why
- **Tests**: Include test results
- **Screenshots**: For UI changes
- **Documentation**: Update docs if needed
- **Link Issues**: Reference related issues

### Code Review Process

1. Automated checks must pass (tests, linting)
2. At least one approval required
3. Address review feedback
4. Maintain clean commit history

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Angular Team for the excellent framework
- Django community
- Tailwind CSS for the utility-first approach
- All contributors and maintainers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ollieb89/jules_api_ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ollieb89/jules_api_ui/discussions)
- **Email**: buitelaarolivier@gmail.com

## 🎯 Project Status

**Current Version**: 0.0.0 (Development)

**Active Development**: ✅ Yes

**Stability**: 🧪 Alpha/Beta

---

Built with ❤️ by the Jules team
