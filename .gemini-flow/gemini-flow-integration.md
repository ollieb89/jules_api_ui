# 🌌 Gemini-Flow Integration Guide for Jules

## Your Tech Stack Overview

**Frontend (`jules_api`):**

- **Framework:** Angular 21.0.4 + TypeScript 5.9 (Strict Mode)
- **Runtime:** Bun 1.3.5
- **Styling:** Tailwind CSS 4.1.12
- **Architecture:** Standalone Components, Signals, SSR
- **Testing:** Vitest

**Backend (`jules_backend`):**

- **Framework:** Django 5 + Django REST Framework (DRF)
- **Language:** Python 3.11
- **Database:** PostgreSQL (Psycopg 3)
- **Migrations:** Django Migrations
- **Environment:** Pixi (Package & Environment Management)

---

## 📋 Installation & Setup

### 1. Add gemini-flow to Your Project

```bash
# From project root
npm install -g @clduab11/gemini-flow

# Verify installation
gemini-flow --version
gemini-flow extensions list
```

### 2. Create Gemini Configuration File

Create `gemini-flow-config.json` at the project root:

```json
{
  "projectName": "jules",
  "monorepoRoot": ".",
  "protocols": ["a2a", "mcp"],
  "topology": "hierarchical",
  "workspaces": {
    "frontend": {
      "root": "jules_api",
      "type": "angular",
      "port": 4700,
      "commands": {
        "dev": "bun run start",
        "build": "bun run build",
        "test": "bun run test"
      }
    },
    "backend": {
      "root": "jules_backend",
      "type": "django",
      "port": 8444,
      "commands": {
        "dev": "pixi run runserver",
        "migrations": "pixi run migrate",
        "test": "pixi run test"
      }
    }
  },
  "mcp": {
    "filesystem": {
      "enabled": true,
      "rootPath": "."
    },
    "git": {
      "enabled": true
    },
    "github": {
      "enabled": true,
      "requireAuth": true
    }
  },
  "agents": {
    "maxConcurrent": 10,
    "specializations": [
      "frontend-architect",
      "backend-architect",
      "angular-developer",
      "django-developer",
      "test-engineer",
      "devops-specialist"
    ]
  }
}
```

### 3. Create `.gemini-flow/prompts` Directory

```bash
mkdir -p .gemini-flow/prompts
```

---

## 🎯 AI Agent Orchestration for Jules

### Specialized Agents for Your Architecture

#### **Tier 1: Architecture Specialists**

```bash
# Deploy frontend architecture agent (Angular Focus)
gemini-flow agents spawn \
  --name "frontend-architect" \
  --specialization "angular-ssr" \
  --focus "jules_api/src/app" \
  --expertise "angular-signals,standalone-components,ssr,tailwind-v4" \
  --protocols a2a,mcp

# Deploy backend architecture agent (Django Focus)
gemini-flow agents spawn \
  --name "backend-architect" \
  --specialization "django-scalability" \
  --focus "jules_backend" \
  --expertise "django,drf,postgres,optimization,pixi" \
  --protocols a2a,mcp
```

#### **Tier 2: Development Agents**

```bash
# Angular component development
gemini-flow agents spawn \
  --name "angular-dev" \
  --specialization "component-builder" \
  --focus "jules_api/src/app" \
  --expertise "angular-21,typescript,tailwind,signals" \
  --capabilities ["code-generation", "type-safety", "testing"]

# Django API development
gemini-flow agents spawn \
  --name "django-dev" \
  --specialization "api-builder" \
  --focus "jules_backend" \
  --expertise "django-models,drf-serializers,views,orm" \
  --capabilities ["crud-generation", "schema-design", "validation"]
```

#### **Tier 3: Quality & DevOps**

```bash
# Test automation
gemini-flow agents spawn \
  --name "test-engineer" \
  --specialization "test-automation" \
  --focus "jules_api,jules_backend" \
  --expertise "vitest,pytest-django,playwright"

# Database specialist
gemini-flow agents spawn \
  --name "db-specialist" \
  --specialization "database-design" \
  --focus "jules_backend/migrations" \
  --expertise "postgres,django-orm,migrations,optimization"
```

---

## 🚀 Common Workflow Examples

### Workflow 1: Add New Feature (Full Stack)

```bash
# Option A: Direct Command
gemini-flow orchestrate \
  --objective "Add user authentication feature" \
  --scope "full-stack" \
  --complexity "medium" \
  --include-testing true \
  --protocols a2a,mcp

# Expected output:
# ✓ Frontend: Auth service + components in jules_api/src/app
# ✓ Backend: Auth views + serializers in jules_backend/users
# ✓ Database: User migrations via Django
# ✓ Tests: Vitest (Frontend) + pytest-django (Backend)
```

**What happens under the hood:**

1. **frontend-architect** analyzes your Angular standalone component structure.
2. **angular-dev** generates TypeScript-safe auth components using Signals.
3. **django-dev** creates DRF views and Serializers for auth.
4. **db-specialist** creates Django models and runs `makemigrations`.
5. **test-engineer** creates Vitest + pytest test suites.

### Workflow 2: Refactor Components to Signals

```bash
# Analyze current component state
gemini-flow analyze \
  --focus "state-management" \
  --apps "jules_api" \
  --depth "detailed"

# Generate refactoring plan
gemini-flow plan \
  --objective "Migrate to Angular Signals" \
  --current-setup "zone-js" \
  --target-performance "zoneless-ready"

# Execute refactor
gemini-flow execute-plan \
  --coordinators "frontend-architect,angular-dev" \
  --parallel-tasks true
```

### Workflow 3: Database Migration & Schema Update

```bash
# Design new schema collaboratively
gemini-flow database design \
  --feature "project-management" \
  --validate-normalization true \
  --generate-migration true \
  --output "jules_backend"

# Agents involved:
# - db-specialist: Schema design
# - django-dev: Django Model definitions
# - backend-architect: Relations review

# Output:
# ✓ Django Model code (models.py)
# ✓ Migration file (via makemigrations)
# ✓ DRF Serializers
# ✓ API ViewSets
```

---

## 🛠️ MCP Server Integration

### Available MCP Servers for Your Stack

```bash
# List active MCP servers
gemini-flow mcp list

# Output for your setup:
# ✓ Filesystem - Access jules_api and jules_backend files
# ✓ Sequential Thinking - Complex reasoning
# ✓ Serena - Workspace Context & Memory
```

### Environment Variable Management

```bash
# Create .env configuration safely
gemini-flow config env \
  --backend-vars "DATABASE_URL,SECRET_KEY,DJANGO_ALLOWED_HOSTS" \
  --secure-input true

# Generates .env.example (no secrets)
```

---

## 🚨 Troubleshooting Common Issues

### Issue: Pixi environment not found

```bash
# Ensure you are running commands via pixi
pixi run runserver ...
```

### Issue: Angular SSR Hydration errors

```bash
# Analyze hydration
gemini-flow analyze hydration \
  --focus "jules_api"
```

---

## 📚 Resources

- **Gemini-Flow Docs:** <https://github.com/clduab11/gemini-flow>
- **Jules Repo:** <https://github.com/your-org/jules>
