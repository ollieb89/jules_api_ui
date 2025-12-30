# Jules API UI - Architecture & Tech Stack Document

## 🏗️ ARCHITECTURE OVERVIEW

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages/Routes                                            │   │
│  │  - Dashboard (overview, widgets)                         │   │
│  │  - Tasks (create, list, detail)                          │   │
│  │  - Code Review (diff viewer, approval)                   │   │
│  │  - Settings (auth, integrations)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  State Management Layer                                  │   │
│  │  - TanStack Query (server state caching)                 │   │
│  │  - Zustand (client state: auth, UI)                      │   │
│  │  - Local Storage (preferences)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services & Hooks                                        │   │
│  │  - useJulesAPI (Jules API client)                        │   │
│  │  - useGitHubAPI (GitHub API client)                      │   │
│  │  - useWebSocket (Real-time updates)                      │   │
│  │  - useAuth (Authentication)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Components (Atomic Design)                              │   │
│  │  - Atoms (Button, Input, Badge)                          │   │
│  │  - Molecules (TaskCard, StatusBadge)                     │   │
│  │  - Organisms (TaskList, DiffViewer)                      │   │
│  │  - Templates (Layouts)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
    ┌─────────┐        ┌────────────┐      ┌──────────────┐
    │ Jules   │        │ GitHub     │      │ WebSocket /  │
    │ API     │        │ API        │      │ SSE Server   │
    └─────────┘        └────────────┘      └──────────────┘
         ↓                    ↓                    ↓
    ┌─────────────────────────────────────────────────────┐
    │           External Services                         │
    │  - Jules Coding Agent (Google Cloud)                │
    │  - GitHub (OAuth, API, Webhooks)                    │
    │  - Database (Supabase/Firebase)                     │
    └─────────────────────────────────────────────────────┘
```

---

## 📁 COMPLETE FOLDER STRUCTURE WITH DESCRIPTIONS

### Root Level
```
jules-api-ui/
├── src/                      # Source code
├── public/                    # Static assets
├── tests/                     # Test files
├── .github/                   # GitHub configuration
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
├── eslint.config.js           # ESLint rules
├── prettier.config.js         # Code formatting
├── package.json               # Dependencies
├── README.md                  # Documentation
└── LICENSE                    # MIT License
```

### `/src` Structure

```
src/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Home/landing page
│   ├── loading.tsx           # Loading skeleton
│   ├── error.tsx             # Error boundary
│   ├── not-found.tsx         # 404 page
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard wrapper layout
│   │   ├── page.tsx          # Dashboard overview
│   │   └── loading.tsx       # Dashboard loading state
│   ├── tasks/
│   │   ├── page.tsx          # Tasks list page
│   │   ├── layout.tsx        # Tasks layout
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Task detail page
│   │   │   └── layout.tsx
│   │   └── new/
│   │       └── page.tsx      # Create task page
│   ├── code-review/
│   │   ├── page.tsx          # Code review dashboard
│   │   ├── [taskId]/
│   │   │   └── page.tsx      # Task code review
│   │   └── layout.tsx
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx      # Login page
│   │   ├── callback/
│   │   │   └── page.tsx      # OAuth callback
│   │   └── settings/
│   │       └── page.tsx      # Auth settings
│   └── api/                  # API routes
│       ├── auth/
│       │   ├── [...nextauth].ts  # NextAuth configuration
│       │   └── logout.ts
│       ├── webhooks/
│       │   ├── github.ts     # GitHub webhook receiver
│       │   └── jules.ts      # Jules webhook receiver
│       └── tasks/
│           ├── route.ts      # Task CRUD endpoints
│           └── [id]/
│               └── route.ts
│
├── components/               # React components
│   ├── common/
│   │   ├── Header.tsx
│   │   │   ├── Navigation menu
│   │   │   ├── User profile dropdown
│   │   │   └── Theme toggle
│   │   ├── Sidebar.tsx
│   │   │   ├── Navigation links
│   │   │   ├── Collapsible sections
│   │   │   └── Active state indicators
│   │   ├── Footer.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx         # Toast notifications
│   │
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx     # Main grid layout
│   │   ├── TaskWidget.tsx        # Task count widget
│   │   ├── ProgressChart.tsx     # Task progress chart
│   │   ├── RecentTasksList.tsx   # Recent tasks display
│   │   ├── StatusIndicator.tsx   # Overall status
│   │   ├── QuickActions.tsx      # Action buttons
│   │   └── Analytics.tsx         # Success rate display
│   │
│   ├── tasks/
│   │   ├── TaskForm.tsx
│   │   │   ├── Form fields (description, params)
│   │   │   ├── Language/framework selector
│   │   │   ├── Validation display
│   │   │   └── Submit button
│   │   ├── TaskList.tsx
│   │   │   ├── Search/filter
│   │   │   ├── Sort options
│   │   │   ├── Pagination
│   │   │   └── Task card list
│   │   ├── TaskCard.tsx
│   │   │   ├── Task title/description
│   │   │   ├── Status badge
│   │   │   ├── Progress bar
│   │   │   └── Action buttons
│   │   ├── TaskDetailPanel.tsx
│   │   │   ├── Full task info
│   │   │   ├── Execution logs
│   │   │   ├── Status timeline
│   │   │   └── Control buttons
│   │   ├── TaskActions.tsx
│   │   │   ├── Cancel button
│   │   │   ├── Pause button
│   │   │   └── Retry button
│   │   └── TaskHistoryList.tsx
│   │       ├── Past tasks
│   │       └── Rerun option
│   │
│   ├── code-review/
│   │   ├── DiffViewer.tsx
│   │   │   ├── Side-by-side diff view
│   │   │   ├── Syntax highlighting
│   │   │   ├── Line numbers
│   │   │   └── Collapse sections
│   │   ├── ApprovalPanel.tsx
│   │   │   ├── Approve button
│   │   │   ├── Reject button
│   │   │   ├── Comments section
│   │   │   └── Submission form
│   │   ├── CodeEditor.tsx
│   │   │   ├── Read-only code display
│   │   │   ├── Language detection
│   │   │   └── Copy button
│   │   ├── PRStatus.tsx
│   │   │   ├── PR link
│   │   │   ├── Current branch
│   │   │   ├── Reviewer info
│   │   │   └── Status badge
│   │   └── CommitPreview.tsx
│   │       ├── Commit message
│   │       └── File list
│   │
│   ├── integrations/
│   │   ├── GitHubConnect.tsx
│   │   │   ├── OAuth login button
│   │   │   ├── Scopes explanation
│   │   │   └── Connection status
│   │   ├── WebhookConfig.tsx
│   │   │   ├── Webhook URL display
│   │   │   ├── Test trigger button
│   │   │   ├── Event selection
│   │   │   └── Logs display
│   │   ├── GitHubPRManager.tsx
│   │   │   ├── PR list
│   │   │   ├── Status filters
│   │   │   ├── PR detail view
│   │   │   └── Merge button
│   │   ├── APIKeyManager.tsx
│   │   │   ├── Generate key button
│   │   │   ├── Key display (masked)
│   │   │   ├── Copy button
│   │   │   └── Revoke button
│   │   └── IntegrationStatus.tsx
│   │       ├── Service status dots
│   │       ├── Last sync time
│   │       └── Reconnect button
│   │
│   ├── ui/                   # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── progress.tsx
│   │   └── select.tsx
│   │
│   └── providers/
│       ├── AuthProvider.tsx      # NextAuth provider
│       ├── QueryProvider.tsx     # TanStack Query provider
│       └── ThemeProvider.tsx     # Theme/dark mode provider
│
├── hooks/                    # Custom React hooks
│   ├── useJulesAPI.ts
│   │   └── // Wrapper for Jules API calls
│   │       export const useJulesAPI = () => {
│   │         // Create task, get tasks, update status, etc.
│   │       }
│   ├── useGitHubAPI.ts
│   │   └── // GitHub API integration
│   │       export const useGitHubAPI = () => {
│   │         // Create PR, get PR status, merge, etc.
│   │       }
│   ├── useWebSocket.ts
│   │   └── // Real-time task updates
│   │       export const useWebSocket = (taskId) => {
│   │         // Connect, listen, update UI
│   │       }
│   ├── useAuth.ts
│   │   └── // Authentication state
│   │       export const useAuth = () => {
│   │         // Current user, logout, permissions
│   │       }
│   ├── useLocalStorage.ts
│   │   └── // Persistent storage
│   ├── useDebounce.ts
│   │   └── // Debounce values
│   ├── useAsync.ts
│   │   └── // Async state management
│   └── useDarkMode.ts
│       └── // Theme switching
│
├── services/                 # API clients & business logic
│   ├── api/
│   │   ├── julesClient.ts
│   │   │   └── // Jules API wrapper with Axios
│   │   │       export const julesClient = axios.create(...)
│   │   │       export const TaskAPI = { create, list, get, update, cancel }
│   │   ├── githubClient.ts
│   │   │   └── // GitHub API wrapper
│   │   │       export const GitHubAPI = { createPR, getPR, mergePR }
│   │   ├── webhookService.ts
│   │   │   └── // Webhook setup and management
│   │   ├── authService.ts
│   │   │   └── // Authentication logic
│   │   └── storageService.ts
│   │       └── // Local/session storage helpers
│   │
│   ├── socket/
│   │   ├── socketClient.ts
│   │   │   └── // WebSocket/SSE connection
│   │   │       export const socket = io(...)
│   │   │       socket.on('task:update', handler)
│   │   └── socketEvents.ts
│   │       └── // Event type definitions
│   │           export const SocketEvents = { ... }
│   │
│   └── notifications/
│       └── notificationService.ts
│           └── // Toast/notification helpers
│
├── types/                    # TypeScript type definitions
│   ├── index.ts              // Re-exports all types
│   ├── api.ts
│   │   └── // API request/response types
│   │       export type CreateTaskRequest = { ... }
│   │       export type Task = { ... }
│   │       export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
│   ├── task.ts
│   │   └── // Task entity types
│   │       export interface Task { ... }
│   │       export interface TaskTemplate { ... }
│   ├── github.ts
│   │   └── // GitHub types
│   │       export interface GitHubPR { ... }
│   │       export interface GitHubUser { ... }
│   ├── user.ts
│   │   └── // User/auth types
│   │       export interface User { ... }
│   │       export interface Session { ... }
│   └── common.ts
│       └── // Shared types
│           export type Optional<T> = T | null | undefined
│
├── utils/                    # Utility functions
│   ├── validators.ts
│   │   └── // Zod schemas for validation
│   │       export const CreateTaskSchema = z.object(...)
│   ├── formatters.ts
│   │   └── // Date, status, code formatters
│   │       export const formatDate = (date: Date) => ...
│   │       export const formatTaskStatus = (status) => ...
│   ├── errorHandler.ts
│   │   └── // Error handling utilities
│   │       export const handleAPIError = (error) => ...
│   ├── logger.ts
│   │   └── // Client-side logging
│   │       export const log = { ... }
│   ├── colorUtils.ts
│   │   └── // Color manipulation
│   │       export const getStatusColor = (status) => ...
│   ├── dateUtils.ts
│   │   └── // Date helpers
│   │       export const formatRelativeTime = (date) => ...
│   └── stringUtils.ts
│       └── // String manipulation
│           export const truncate = (str, len) => ...
│
├── constants/                # Constants and configuration
│   ├── endpoints.ts
│   │   └── // API endpoint URLs
│   │       export const API_ENDPOINTS = { ... }
│   ├── config.ts
│   │   └── // App configuration
│   │       export const CONFIG = { ... }
│   ├── colors.ts
│   │   └── // Design tokens/colors
│   │       export const COLORS = { ... }
│   ├── taskStatuses.ts
│   │   └── // Task status options
│   │       export const TASK_STATUSES = { ... }
│   └── limits.ts
│       └── // Rate limits, pagination, etc.
│           export const PAGINATION_SIZE = 20
│
├── store/                    # Zustand state stores
│   ├── authStore.ts
│   │   └── // User authentication state
│   │       export const useAuthStore = create((set) => ({
│   │         user: null,
│   │         isAuthenticated: false,
│   │         logout: () => set({ user: null })
│   │       }))
│   ├── taskStore.ts
│   │   └── // Task-related state
│   │       export const useTaskStore = create((set) => ({
│   │         tasks: [],
│   │         selectedTaskId: null,
│   │         addTask: (task) => set(...)
│   │       }))
│   ├── uiStore.ts
│   │   └── // UI state (theme, modals, etc.)
│   │       export const useUIStore = create((set) => ({
│   │         isDarkMode: false,
│   │         openModals: [],
│   │         toggleDarkMode: () => set(...)
│   │       }))
│   └── notificationStore.ts
│       └── // Toast/notification state
│           export const useNotificationStore = create(...)
│
├── styles/                   # Global styles
│   ├── globals.css
│   │   └── // CSS reset, HTML base styles
│   │       @tailwind base, components, utilities
│   │       ::before, ::after { ... }
│   │       html { ... }
│   ├── colors.css
│   │   └── // Design token CSS variables
│   │       :root {
│   │         --color-primary-500: #0ea5e9;
│   │         --color-success-500: #22c55e;
│   │         ...
│   │       }
│   ├── animations.css
│   │   └── // Custom keyframes and animations
│   │       @keyframes fadeIn { ... }
│   │       @keyframes slideUp { ... }
│   └── typography.css
│       └── // Custom font configurations
│
└── middleware.ts             # Next.js middleware (optional)
    └── // Authentication checks, redirects
```

### `/tests` Structure

```
tests/
├── unit/
│   ├── hooks/
│   │   ├── useJulesAPI.test.ts
│   │   ├── useGitHubAPI.test.ts
│   │   └── useAuth.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   ├── formatters.test.ts
│   │   └── errorHandler.test.ts
│   └── store/
│       ├── authStore.test.ts
│       └── taskStore.test.ts
│
├── integration/
│   ├── api/
│   │   ├── julesClient.test.ts
│   │   ├── githubClient.test.ts
│   │   └── authFlow.test.ts
│   └── components/
│       ├── TaskForm.test.tsx
│       └── DiffViewer.test.tsx
│
├── e2e/
│   ├── dashboard.test.ts
│   ├── taskCreation.test.ts
│   ├── codeReview.test.ts
│   └── githubIntegration.test.ts
│
└── mocks/
    ├── handlers.ts           # MSW handlers
    ├── data/
    │   ├── tasks.ts
    │   └── github.ts
    └── factories/
        └── taskFactory.ts
```

### `/public` Structure

```
public/
├── icons/
│   ├── favicon.ico
│   ├── tasks.svg
│   ├── github.svg
│   └── check-circle.svg
├── images/
│   ├── logo.svg
│   ├── empty-state.svg
│   └── error-illustration.svg
└── fonts/
    └── [font files if needed]
```

---

## 🔄 DATA FLOW PATTERNS

### Creating a Task
```
User Input
  ↓
TaskForm Component
  ↓
Zod Validation
  ↓
useJulesAPI Hook
  ↓
julesClient.post('/tasks')
  ↓
Backend stores task
  ↓
useTaskStore updates Zustand
  ↓
TanStack Query invalidates cache
  ↓
UI updates automatically
  ↓
WebSocket connects for live updates
```

### Real-time Task Updates
```
Jules API (backend)
  ↓
WebSocket Server
  ↓
socket.on('task:update')
  ↓
useWebSocket Hook
  ↓
useTaskStore.updateTask()
  ↓
UI re-renders automatically
  ↓
Toast notification appears
```

### GitHub Integration Flow
```
User clicks "Connect GitHub"
  ↓
GitHubConnect Component
  ↓
OAuth redirect to GitHub
  ↓
User authorizes scopes
  ↓
GitHub redirects to /api/auth/callback
  ↓
Token stored securely
  ↓
useGitHubAPI available
  ↓
Can now create PRs, get status, etc.
```

---

## 🔌 API INTEGRATION PATTERNS

### Jules API Client Pattern
```typescript
// services/api/julesClient.ts

import axios from 'axios'

const julesClient = axios.create({
  baseURL: process.env.REACT_APP_JULES_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor for auth
julesClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jules_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
julesClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
    }
    return Promise.reject(error)
  }
)

export const TaskAPI = {
  create: (params) => julesClient.post('/tasks', params),
  list: (filters) => julesClient.get('/tasks', { params: filters }),
  get: (id) => julesClient.get(`/tasks/${id}`),
  update: (id, params) => julesClient.patch(`/tasks/${id}`, params),
  cancel: (id) => julesClient.post(`/tasks/${id}/cancel`),
  getStatus: (id) => julesClient.get(`/tasks/${id}/status`),
}
```

### Hook Pattern for API Calls
```typescript
// hooks/useJulesAPI.ts

import { useQuery, useMutation } from '@tanstack/react-query'
import { TaskAPI } from '@/services/api/julesClient'

export const useJulesAPI = () => {
  const createTask = useMutation({
    mutationFn: TaskAPI.create,
    onSuccess: () => {
      // Invalidate task list query
      // Show success toast
    },
    onError: (error) => {
      // Show error toast
    },
  })

  const getTasks = useQuery({
    queryKey: ['tasks'],
    queryFn: TaskAPI.list,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return { createTask, getTasks }
}
```

---

## 🧩 COMPONENT PATTERNS

### Container/Presenter Pattern
```typescript
// components/tasks/TaskListContainer.tsx (Container)
export const TaskListContainer = () => {
  const { data, isLoading } = useTaskStore()
  const [filters, setFilters] = useState({})
  
  return <TaskListPresenter tasks={data} isLoading={isLoading} />
}

// components/tasks/TaskListPresenter.tsx (Presenter)
interface TaskListPresenterProps {
  tasks: Task[]
  isLoading: boolean
}

export const TaskListPresenter = ({ tasks, isLoading }: TaskListPresenterProps) => {
  return (
    <div className="space-y-4">
      {isLoading ? <Skeleton /> : tasks.map(task => <TaskCard {...task} />)}
    </div>
  )
}
```

### Compound Component Pattern
```typescript
// components/tasks/TaskDetail.tsx
export const TaskDetail = {
  Root: TaskDetailRoot,
  Header: TaskDetailHeader,
  Body: TaskDetailBody,
  Footer: TaskDetailFooter,
}

// Usage:
<TaskDetail.Root taskId={id}>
  <TaskDetail.Header />
  <TaskDetail.Body />
  <TaskDetail.Footer />
</TaskDetail.Root>
```

---

## 📊 STATE MANAGEMENT PATTERNS

### TanStack Query (Server State)
```typescript
// For API data that's shared and needs synchronization
const { data: tasks, isLoading, error } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => TaskAPI.list(filters),
})
```

### Zustand (Client State)
```typescript
// For UI state that doesn't come from API
export const useUIStore = create((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}))

// Usage in component
const isDarkMode = useUIStore((state) => state.isDarkMode)
```

### Local Component State
```typescript
// For state only used in one component
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({})
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Development
```
Local machine
  ↓
npm run dev
  ↓
Vite dev server (localhost:5173)
  ↓
Hot module replacement
```

### Staging/Production
```
GitHub push to main
  ↓
GitHub Actions CI/CD
  ↓
Run tests
  ↓
Build: npm run build
  ↓
Deploy to Vercel/Netlify
  ↓
Environment variables injected
  ↓
CDN distribution
```

---

## 📝 ENVIRONMENT VARIABLES

```env
# API Configuration
REACT_APP_JULES_API_URL=https://api.jules.google/v1
REACT_APP_JULES_API_KEY=your_api_key_here

# GitHub OAuth
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Database
DATABASE_URL=your_database_connection_string

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Feature flags
NEXT_PUBLIC_ENABLE_WEBHOOKS=true
NEXT_PUBLIC_ENABLE_CODE_REVIEW=true
```

---

## 🔒 Security Considerations

### Authentication
- Use NextAuth.js for OAuth flow
- Store tokens in HttpOnly cookies
- Implement token refresh logic
- Never expose secrets in client code

### API Communication
- All API calls over HTTPS
- CORS properly configured
- Rate limiting on backend
- Input validation (Zod)

### Data Privacy
- Encrypted storage for sensitive data
- Secure WebSocket connections (WSS)
- User data retention policies
- GDPR compliance considerations

---

**Architecture Document Complete** ✅

This provides complete technical guidance for implementing the Jules API UI with proper separation of concerns, scalable patterns, and production-ready structure.

Last Updated: December 30, 2025
