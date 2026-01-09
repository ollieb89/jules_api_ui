# Jules API UI - Custom Implementation Prompt for AI Coding Tools

> **Stack alignment:** This repo is **Angular 21 SSR + Django** with Bun/Pixi tooling. Any prior
> references to React, Turborepo, Prisma, or module federation are legacy and superseded.

## 🎯 Your Project Context

**Project Name:** Jules API UI Dashboard
**User Base:** Solo Developer (Individual Developer)
**Target Users:** 100-1,000 users managing 10k-100k Jules tasks monthly
**Deployment:** Cloud SaaS (Vercel/Netlify) - Serverless
**Timeline:** 3-6 months to production-ready product
**Budget:** Minimal ($0-5k for tools/services)
**Team:** Solo Developer

---

## 📋 SYSTEM CONTEXT

You are an expert full-stack frontend engineer specializing in modern web applications with deep expertise in:
- Angular 21 SSR with TypeScript
- Real-time UI updates and Server-Sent Events (SSE)
- GitHub API integration and OAuth flows
- Webhook architecture and CI/CD pipeline integration
- Beautiful, modern UI design with Tailwind CSS
- Scalable component architecture

Your mission: Build a production-grade Jules API UI dashboard that empowers solo developers to manage AI-powered code generation tasks with confidence, beautiful aesthetics, and seamless GitHub integration.

---

## 🎨 PROJECT VISION

### One-Sentence Summary
**A modern hybrid dashboard for solo developers to create, monitor, review, and approve Jules AI-generated code with live updates and GitHub integration.**

### What Success Looks Like
✅ Developers can create and monitor Jules tasks with real-time progress
✅ Automatic GitHub PR creation and code review workflow
✅ Webhook triggers for CI/CD pipeline automation
✅ Beautiful, modern interface with smooth interactions
✅ Fast, responsive performance across desktop and tablet
✅ Serverless deployment with automatic scaling
✅ Task completion rate tracking and success metrics

---

## 🏗️ CORE ARCHITECTURE

### Technology Stack (Fixed)
- **Framework:** Angular 21 SSR with TypeScript (strict mode)
- **Build Tool:** Angular CLI with Bun
- **State Management:** Angular signals + services
- **HTTP Client:** Angular HttpClient with typed API services
- **Styling:** Tailwind CSS + custom design tokens
- **UI Components:** Angular Material + custom components
- **Real-time Updates:** Server-Sent Events (SSE)
- **Forms:** Angular Reactive Forms + validators
- **Code Diff Viewer:** ngx-markdown + custom diff components
- **Date/Time:** date-fns
- **Testing:** Angular test runner + Vitest
- **Hosting:** Node SSR or static build with CDN
- **Database:** PostgreSQL (via Django)
- **Authentication:** Django REST + JWT

### Folder Structure
```
/src
  /app
    /components
      /dashboard             (Dashboard widgets)
      /tasks                 (Task list + detail UI)
      /shared                (Buttons, cards, dialogs)
    /services
      /jules.service.ts      (HTTP API integration)
      /jules-stream.service.ts (SSE streams)
      /auth.service.ts       (Authentication)
    /routes
      /jules                 (Session + activity routes)
      /settings              (API settings)
    /utils
      /api-parsers.ts        (API normalization helpers)
    app.routes.ts            (Standalone route config)
    app.ts                   (Root component)
  /styles
    /components              (Component-level styles)
    /colors                  (Design tokens)
```
    /api
      /julesClient.ts        (Jules API wrapper)
      /githubClient.ts       (GitHub API wrapper)
      /webhookService.ts     (Webhook setup/management)
      /authService.ts        (Authentication service)
    /sse
      /sseClient.ts          (SSE connection)
      /sseEvents.ts          (Event handlers)
  
  /types
    /index.ts                (Global type definitions)
    /api.ts                  (API response types)
    /task.ts                 (Task entity types)
    /github.ts               (GitHub types)
    /user.ts                 (User types)
  
  /utils
    /validators.ts           (Angular validators)
    /formatters.ts           (Date, status formatters)
    /errorHandler.ts         (Global error handling)
    /logger.ts               (Client-side logging)
    /colorUtils.ts           (Color manipulation)
  
  /constants
    /endpoints.ts            (API endpoints)
    /config.ts               (App configuration)
    /colors.ts               (Design tokens)
  
  /state
    /auth-state.service.ts   (Auth state)
    /task-state.service.ts   (Task state)
    /ui-state.service.ts     (UI state)
  
  /styles
    /globals.css             (Global styles)
    /colors.css              (Color system)
    /animations.css          (Transition animations)

/tests
  /unit
    /hooks.test.ts
    /utils.test.ts
  /integration
    /api.test.ts
  /e2e
    /dashboard.test.ts

/public
  /icons
  /images

/.env.example              (Environment variables template)
/angular.json             (Angular CLI configuration)
/tsconfig.json            (TypeScript configuration)
/tailwind.config.js       (Tailwind configuration)
/postcss.config.js        (PostCSS configuration)
```

---

## 🎯 CORE FEATURES - IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Weeks 1-8)
**Goal:** MVP with core Jules task management and real-time updates

#### Feature: Authentication & User Management
- Email/password authentication with optional 2FA
- Secure session management (JWT tokens)
- User profile settings
- Logout functionality
- **Implementation:** Django REST + JWT

#### Feature: Dashboard Overview
- Real-time task status widgets
- Quick-access buttons (New Task, Recent Tasks)
- Task completion rate chart
- Active tasks indicator
- **Implementation:** Angular components with services + signals

#### Feature: Task Creation
- Form to create new Jules task
- Input validation (Zod)
- Task description/parameters
- Select coding language/framework
- **Implementation:** Angular Reactive Forms + dialog

#### Feature: Task Management
- Create new Jules tasks
- View all tasks (list view)
- Real-time task progress updates
- Cancel/pause tasks mid-execution
- Task details panel
- **Implementation:** Angular services + SSE streams

#### Feature: Real-time Updates
- SSE connection to Jules API
- Live task progress updates (every 1-2 seconds)
- Status change notifications
- Error alerts
- **Implementation:** Server-Sent Events (SSE)

#### Feature: GitHub Authentication
- OAuth flow for GitHub connection
- Secure token storage (HttpOnly cookies)
- User permissions scoping
- Disconnect option
- **Implementation:** GitHub OAuth + secure backend

---

### Phase 2: Integration & Code Review (Weeks 9-16)
**Goal:** Full GitHub integration, code review, webhooks

#### Feature: GitHub Integration - Pull Requests
- Auto-create GitHub PRs from Jules tasks
- View linked PR status
- Display PR branch/commit info
- Show PR reviewers
- **Implementation:** GitHub API client + UI components

#### Feature: Code Review & Approval
- Embedded diff viewer (side-by-side)
- Highlight changes (added/removed/modified lines)
- Approve button (merge to main)
- Reject button (request changes)
- Status indicators (pending/approved/rejected)
- **Implementation:** react-diff-viewer + custom panels

#### Feature: Task Templates
- Pre-built templates (common patterns)
- Create custom templates
- Template search/filter
- Clone and modify templates
- **Implementation:** Database + UI for template management

#### Feature: Scheduled Tasks
- Schedule Jules tasks for specific times
- Cron-like scheduling interface
- View scheduled tasks
- Edit/cancel scheduled tasks
- **Implementation:** Backend scheduling + UI calendar

#### Feature: Webhook Configuration
- User can add custom webhooks
- Webhook test trigger
- Webhook logs/history
- Enable/disable webhooks
- **Implementation:** Webhook management UI + API

#### Feature: API Access
- Generate API keys for external tools
- Revoke API keys
- API documentation
- Rate limit display
- **Implementation:** API key management + documentation

#### Feature: Task History
- Searchable list of all past tasks
- Filter by status/date/type
- Rerun past tasks
- Task execution details
- **Implementation:** Angular services + search UI

---

### Phase 3: Polish & Optimization (Weeks 17-24)
**Goal:** Production-ready, optimized, fully tested

#### Performance Optimization
- Code splitting by route
- Lazy loading of components
- Image optimization
- Caching strategies
- Bundle size analysis
- **Target:** <2 second page load, Lighthouse 90+

#### Error Handling & Resilience
- Global error boundary
- Toast notifications for errors
- Retry logic for failed requests
- Fallback UI states
- Error logging to Sentry

#### Testing
- Unit tests for hooks, utils, services
- Integration tests for API flows
- E2E tests for critical user journeys
- 70%+ code coverage
- **Tools:** Vitest, Angular TestBed, Playwright

#### Documentation
- Component Storybook stories
- API documentation
- User guide/docs
- Developer setup guide
- Deployment instructions

#### Accessibility & UX
- Keyboard navigation support
- Focus indicators visible
- Color contrast verified (WCAG AA)
- Loading states for all async operations
- Smooth loading animations

#### Design Polish
- Consistent spacing (8px grid)
- Smooth transitions and animations
- Hover states on all interactive elements
- Micro-interactions for feedback
- Color palette application throughout

---

### Phase 4: Post-Launch Growth & Operations (Ongoing)
**Goal:** Sustain quality, scale adoption, and improve product-market fit

#### Observability & Reliability
- Sentry error tracking and alerting
- Performance dashboards (Core Web Vitals)
- Uptime monitoring and incident playbooks
- Automated regression checks after releases

#### Scaling & Efficiency
- Backend/query optimizations based on usage
- Caching enhancements and CDN tuning
- Cost monitoring and budget alerts
- Feature flagging for safe rollouts

#### Product Growth
- Usage analytics and funnel tracking
- In-app onboarding and guided tours
- Feedback collection and roadmap iteration
- Iterative UX improvements from user data

#### Security & Compliance
- Regular dependency audits
- Token rotation and secret management
- Access control reviews
- Data retention and export policies

---

## 🎨 DESIGN SYSTEM SPECIFICATION

### Color Palette (Use CSS Variables)
**Primary Colors:**
- Primary-500: #0ea5e9 (Sky Blue - Actions)
- Primary-600: #0284c7 (Hover state)
- Primary-700: #0369a1 (Active state)

**Semantic Colors:**
- Success-500: #22c55e (Approved, completed)
- Error-500: #ef4444 (Failed, rejected)
- Warning-500: #f59e0b (In progress, caution)
- Info-500: #3b82f6 (Information)

**Neutral Colors:**
- Gray-50: #fafafa (Backgrounds)
- Gray-100: #f5f5f5 (Surfaces)
- Gray-200: #e5e5e5 (Borders)
- Gray-600: #525252 (Text secondary)
- Gray-900: #171717 (Text primary)

**Dark Mode:**
- Background: #1a1a1a
- Surface: #262626
- Text: #f5f5f5
- Borders: #404040

### Typography
- **Font Family:** Inter, system fonts
- **Headings:** Font-weight 600-700
- **Body:** Font-weight 400-500
- **Sizes:** 12px (small), 14px (base), 16px (lg), 18px (xl), 20px (2xl), 24px (3xl)

### Components Style
- **Border Radius:** 8px (default), 4px (small), 12px (lg)
- **Shadows:** Subtle (0 1px 3px), medium (0 4px 6px), large (0 10px 15px)
- **Spacing:** 8px grid (8, 16, 24, 32, 40, 48)
- **Transitions:** 150ms-250ms ease-out

### Dark Mode Support
- Implement via `prefers-color-scheme` + manual toggle
- All colors use CSS variables
- Smooth transition between modes
- Persist user preference (localStorage)

---

## 🔌 API INTEGRATION PATTERNS

### Jules API Integration
```typescript
// Base endpoint pattern
const JULES_API_BASE = process.env.JULES_API_URL
const JULES_API_KEY = process.env.JULES_API_KEY

// Axios instance with interceptors
const julesClient = axios.create({
  baseURL: JULES_API_BASE,
  headers: {
    'Authorization': `Bearer ${JULES_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// Request/response interceptors
julesClient.interceptors.request.use(...)
julesClient.interceptors.response.use(...)
```

### Endpoints to Implement
- `POST /tasks` - Create task
- `GET /tasks` - List tasks
- `GET /tasks/:id` - Get task details
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Cancel task
- `GET /tasks/:id/status` - Get live status
- `GET /tasks/:id/output` - Get task output

### GitHub API Integration
```typescript
// OAuth flow via Django backend + JWT
// Use GitHub API for:
// - Creating PRs from Jules tasks
// - Reading PR status
// - Updating PR status
// - Fetching user repos
```

### Real-time Updates Pattern
```typescript
// Use Server-Sent Events (SSE)
// Listen for task status changes
// Update UI in real-time without polling
// Reconnect logic and error handling
```

---

## 🧪 QUALITY STANDARDS

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ ESLint + Prettier for formatting
- ✅ No `any` types without justification
- ✅ Comprehensive error handling
- ✅ Clear variable/function naming
- ✅ JSDoc comments for public APIs

### Performance Standards
- ✅ Page load: <2 seconds
- ✅ Time to Interactive: <3 seconds
- ✅ Lighthouse score: 90+
- ✅ Bundle size: <200KB (gzipped)
- ✅ No unnecessary re-renders
- ✅ Images optimized

### Testing Standards
- ✅ 70%+ code coverage
- ✅ All API integrations tested
- ✅ All user workflows tested
- ✅ Error scenarios tested
- ✅ Edge cases covered

### Accessibility Standards
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus indicators visible
- ✅ Color contrast 4.5:1 (WCAG AA)
- ✅ All interactive elements labeled
- ✅ ARIA attributes where needed

---

## 🚀 DEPLOYMENT STRATEGY

### Hosting Platform
- **Primary:** Vercel (automatic deployments from GitHub)
- **Fallback:** Netlify
- **Database:** Supabase (PostgreSQL) or Firebase
- **Auth:** Django REST + JWT

### Environment Setup
```env
JULES_API_URL=https://api.jules.google/v1
JULES_API_KEY=your_api_key
JULES_SSE_URL=https://api.jules.google/v1
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
DATABASE_URL=your_database_url
DJANGO_SECRET_KEY=your_secret
```

### CI/CD Pipeline
- GitHub Actions for automated testing
- Automated deployment on main branch push
- Environment-specific builds (dev, staging, prod)
- Automated lighthouse performance checks

---

## 📊 SUCCESS CRITERIA

### Functional Requirements
✅ All Jules API endpoints working correctly
✅ Real-time task updates (< 2 second latency)
✅ GitHub PR creation and management functional
✅ Code review workflow complete (diff view, approve/reject)
✅ Webhook triggers working
✅ Task templates and scheduling working
✅ Task history searchable and filterable

### Non-Functional Requirements
✅ Page load time < 2 seconds
✅ Mobile responsive (tablet-friendly)
✅ Dark mode fully functional
✅ No console errors in production
✅ Zero unhandled promise rejections
✅ Authentication secure (2FA optional)
✅ Error handling graceful with user feedback

### Design & UX Requirements
✅ Modern, polished interface
✅ Consistent color palette throughout
✅ Smooth animations and transitions
✅ Intuitive navigation
✅ Loading states visible
✅ Error states clear and actionable
✅ Responsive across devices (768px+)

### Business Requirements
✅ Task completion rate tracked
✅ User satisfaction measurable
✅ Minimal code interruptions from automation
✅ Support for 100-1000 concurrent users
✅ Sub-second response times

---

## 📝 IMPLEMENTATION GUIDELINES

### Best Practices
1. **Component Architecture:** Small, single-responsibility components
2. **State Management:** Signals > Services > Component state
3. **Error Handling:** Never fail silently; always inform user
4. **Testing:** Test behavior, not implementation
5. **Performance:** Lazy load, code split, optimize re-renders
6. **Security:** Never expose secrets in code; use environment variables
7. **Accessibility:** Consider keyboard users first
8. **Documentation:** Comment the "why", not the "what"

### Git Workflow
- Conventional commits (feat:, fix:, refactor:, etc.)
- Feature branches off main
- Pull request reviews before merge
- One feature per PR

### Code Review Checklist
- TypeScript types correct?
- Error handling complete?
- Performance acceptable?
- Tests included and passing?
- Documentation clear?
- Accessibility considered?
- Security implications reviewed?

---

## 🎓 LEARNING RESOURCES

### Key Technologies
- Angular Docs: https://angular.dev
- RxJS: https://rxjs.dev
- Angular Testing: https://angular.dev/guide/testing
- Tailwind CSS: https://tailwindcss.com
- Shadcn/ui: https://ui.shadcn.com
- Zod: https://zod.dev
- Angular Reactive Forms: https://angular.dev/guide/forms
- Jules API: https://developers.google.com/jules
- GitHub API: https://docs.github.com/en/rest

---

## 🎯 FINAL NOTES

This is your **custom, production-ready prompt** for building the Jules API UI. It incorporates:

✅ Your specific requirements (solo dev, GitHub integration, webhooks, real-time updates)
✅ Modern tech stack (Angular, TypeScript, Tailwind)
✅ Beautiful design system (custom color palette, modern aesthetics)
✅ Enterprise-grade architecture patterns
✅ Phased implementation plan (3-6 months)
✅ Quality standards (testing, accessibility, performance)

**Use this prompt with:**
- Cursor (cursor.sh)
- GitHub Copilot
- Claude.ai
- Any AI coding tool

Simply copy this entire document and paste it as your system prompt. The AI will understand your project requirements and generate code accordingly.

---

**Ready to build something amazing! 🚀**

Last Updated: December 30, 2025
Status: Production-Ready
