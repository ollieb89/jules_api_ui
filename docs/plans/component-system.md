# Jules API UI - Component System Specification

> **Stack alignment:** This repo is **Angular 21 SSR + Django** with Bun/Pixi tooling. Any prior
> references to React, Turborepo, Prisma, or module federation are legacy and superseded.

## 🎨 DESIGN SYSTEM OVERVIEW

This document defines all components, their props, usage patterns, and design specifications for the Jules API UI application.

---

## 📐 COLOR PALETTE & TOKENS

### Primary Colors
```css
--color-primary-50: #f0f9ff    /* Lightest */
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9   /* Primary Action */
--color-primary-600: #0284c7   /* Hover */
--color-primary-700: #0369a1   /* Active */
--color-primary-800: #075985
--color-primary-900: #0c3d66
```

### Semantic Colors
```css
/* Status Colors */
--color-success-500: #22c55e    /* Completed, Approved */
--color-error-500: #ef4444      /* Failed, Rejected */
--color-warning-500: #f59e0b    /* In Progress, Caution */
--color-info-500: #3b82f6       /* Information */

/* Neutral */
--color-gray-50: #fafafa       /* Lightest background */
--color-gray-100: #f5f5f5
--color-gray-200: #e5e5e5      /* Borders */
--color-gray-300: #d4d4d8
--color-gray-500: #a1a1aa      /* Disabled */
--color-gray-600: #52525b
--color-gray-700: #3f3f46
--color-gray-800: #27272a
--color-gray-900: #18181b      /* Darkest text */

/* Dark Mode */
--color-slate-50: #f8fafc
--color-slate-900: #0f172a
--color-slate-950: #020617
```

### Background Colors
```css
/* Light Mode */
--bg-primary: var(--color-gray-50)
--bg-secondary: var(--color-gray-100)
--bg-surface: white
--bg-elevated: var(--color-gray-50)

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #1a1a1a
  --bg-secondary: #262626
  --bg-surface: #1f1f1f
  --bg-elevated: #2a2a2a
}
```

---

## 🧩 COMPONENT LIBRARY

### ATOMS (Basic building blocks)

#### Button
**Purpose:** Primary interactive element
**Variants:** primary, secondary, outline, ghost, danger

```html
<app-button variant="primary" size="md">
  Create Task
</app-button>
```

```typescript
// Inputs (Angular)
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: TemplateRef<unknown> | string
}
```

**Styles**
- Primary: bg-primary-500, text-white, hover:bg-primary-600
- Secondary: bg-gray-200, text-gray-900, hover:bg-gray-300
- Outline: border-gray-300, text-gray-900, hover:bg-gray-50
- Ghost: no background, text-primary-500, hover:bg-primary-50
- Danger: bg-error-500, text-white, hover:bg-error-600

**Spacing:** 8px 16px (md default)
**Border Radius:** 8px
**Transition:** 150ms ease-out

---

#### Input
**Purpose:** Form input field
**Variants:** text, email, password, number, search

```html
<app-input
  type="text"
  placeholder="Task description"
  [value]="value"
  (valueChange)="onValueChange($event)"
  [error]="error"
></app-input>
```

```typescript
// Inputs (Angular)
interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  error?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: TemplateRef<unknown> | string
}
```

**Styles**
- Border: 1px solid gray-200
- Border Focus: 2px solid primary-500
- Background: white
- Padding: 8px 12px (md default)
- Border Radius: 6px

---

#### Badge
**Purpose:** Display status or tags
**Variants:** success, error, warning, info, neutral

```html
<app-badge variant="success" size="md">
  Completed
</app-badge>
```

```typescript
// Inputs (Angular)
interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  content?: TemplateRef<unknown> | string
}
```

**Styles**
- Background: semantic color (20% opacity)
- Text: semantic color (700 shade)
- Padding: 4px 8px (sm), 6px 12px (md)
- Border Radius: 12px
- Font Weight: 500

---

#### Skeleton
**Purpose:** Loading placeholder
**Variants:** text, circle, rect

```typescript
<Skeleton variant="rect" width={300} height={100} />

// Props
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect'
  width?: number | string
  height?: number | string
  count?: number
}
```

**Animation:** Pulse 2 seconds infinite
**Color:** gray-200 with 50% opacity gradient

---

#### Icon
**Purpose:** Display SVG icons
**Size Options:** xs, sm, md, lg, xl

```typescript
<Icon name="check-circle" size="md" color="success" />

// Props
interface IconProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}
```

**Icons Needed**
- Tasks: check-circle, circle, x-circle, pause-circle, play-circle
- Actions: plus, edit, trash, copy, external-link, more-vertical
- Status: loading, alert, info, warning, success, error
- Navigation: menu, chevron-down, chevron-right, arrow-left

---

### MOLECULES (Combinations of atoms)

#### Card
**Purpose:** Container for content groups
**Features:** Header, body, footer, shadow states

```html
<app-card [hover]="true">
  <app-card-header>
    <h3>Task Title</h3>
  </app-card-header>
  <app-card-body>
    <p>Task description</p>
  </app-card-body>
  <app-card-footer>
    <app-button>Action</app-button>
  </app-card-footer>
</app-card>
```

```typescript
// Inputs (Angular)
interface CardProps {
  hover?: boolean
  selected?: boolean
  content?: TemplateRef<unknown> | string
}
```

**Styles**
- Background: white
- Border: 1px solid gray-200
- Border Radius: 12px
- Shadow: sm (0 1px 3px)
- Hover Shadow: md (if hover=true)
- Padding: 16px (default)

---

#### StatusBadge
**Purpose:** Display task/PR status with icon
**Variants:** pending, running, completed, failed, approved, rejected

```typescript
<StatusBadge status="running" />

// Props
interface StatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

**Status Mapping**
- pending: gray-500, Clock icon, "Pending"
- running: warning-500, Play icon, "Running"
- completed: success-500, Check icon, "Completed"
- failed: error-500, X icon, "Failed"
- approved: success-500, Check icon, "Approved"
- rejected: error-500, X icon, "Rejected"

---

#### FormField
**Purpose:** Label + Input + Error message
**Validation:** Inline error display

```html
<app-form-field label="Task Description" [error]="errors.description" [required]="true">
  <app-input placeholder="Describe the task..."></app-input>
</app-form-field>
```

```typescript
// Inputs (Angular)
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  help?: string
  content?: TemplateRef<unknown> | string
}
```

**Styles**
- Label: font-weight 500, margin-bottom 8px
- Error: text-error-500, font-size 12px, margin-top 4px
- Required: red asterisk after label

---

#### ProgressBar
**Purpose:** Visual task progress indicator
**Features:** Percentage, animated, colored states

```typescript
<ProgressBar value={75} variant="success" showLabel={true} />

// Props
interface ProgressBarProps {
  value: number (0-100)
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}
```

**Styles**
- Height: 4px (sm), 6px (md), 8px (lg)
- Background: gray-200
- Fill: primary-500 (or variant color)
- Border Radius: 4px
- Animation: smooth width transition 300ms

---

#### TimeDisplay
**Purpose:** Show formatted time/date
**Formats:** absolute, relative, full

```typescript
<TimeDisplay date={new Date()} format="relative" />

// Props
interface TimeDisplayProps {
  date: Date
  format?: 'absolute' | 'relative' | 'full'
}
```

**Formats**
- relative: "2 hours ago", "in 5 minutes"
- absolute: "Dec 30, 2025"
- full: "Dec 30, 2025 at 11:40 PM"

---

### ORGANISMS (Complex components)

#### TaskForm
**Purpose:** Create/edit Jules task
**Features:** Validation, template selection, advanced options

```typescript
<TaskForm
  onSubmit={(data) => createTask(data)}
  isLoading={isCreating}
  defaultValues={selectedTemplate}
/>

// Props
interface TaskFormProps {
  onSubmit: (data: CreateTaskRequest) => Promise<void>
  isLoading?: boolean
  defaultValues?: Partial<Task>
}
```

**Fields**
- Description: textarea (required, max 500 chars)
- Language: select (required, options from Jules API)
- Framework: select (optional, depends on language)
- Advanced Options: collapsible section
  - Timeout: number (default 300s)
  - Retries: number (default 3)
  - Priority: select (low, medium, high)

**Validation (Zod)**
- description: min 10, max 500 chars
- language: required, valid option
- framework: if provided, valid for language

---

#### TaskList
**Purpose:** Display tasks with search/filter
**Features:** Pagination, sorting, inline actions

```typescript
<TaskList
  tasks={tasks}
  onSelectTask={setSelectedTaskId}
  onRetry={retryTask}
  isLoading={isLoading}
/>

// Props
interface TaskListProps {
  tasks: Task[]
  selectedTaskId?: string
  onSelectTask?: (taskId: string) => void
  onRetry?: (taskId: string) => void
  onCancel?: (taskId: string) => void
  isLoading?: boolean
  searchTerm?: string
  onSearchChange?: (term: string) => void
  sortBy?: 'date' | 'status' | 'name'
  onSortChange?: (sort: string) => void
}
```

**Features**
- Search by task name/description
- Filter by status
- Sort by date (newest), status, name
- Pagination (20 items per page)
- Inline actions (view, cancel, retry)
- Empty state message
- Loading skeleton

---

#### TaskDetailPanel
**Purpose:** Full task information and controls
**Features:** Status timeline, logs, actions

```typescript
<TaskDetailPanel taskId={taskId} />

// Props
interface TaskDetailPanelProps {
  taskId: string
  onClose?: () => void
}
```

**Sections**
- Header: Title, status badge, creation date
- Overview: Description, language, framework
- Timeline: Status changes with timestamps
- Logs: Execution logs (scrollable)
- Output: Task result/code generated
- Actions: Cancel, retry buttons

**Real-time Updates**
- Status changes instantly
- Logs stream in real-time
- Progress percentage updates

---

#### DiffViewer
**Purpose:** Display code changes side-by-side
**Features:** Syntax highlighting, line numbers, folding

```typescript
<DiffViewer
  oldCode={previousCode}
  newCode={generatedCode}
  language="javascript"
/>

// Props
interface DiffViewerProps {
  oldCode: string
  newCode: string
  language: string
  splitView?: boolean
  showLineNumbers?: boolean
  onApprove?: () => void
  onReject?: () => void
}
```

**Features**
- Syntax highlighting via Prism.js
- Side-by-side diff view
- Line numbers
- Added lines: green background
- Removed lines: red background
- Modified lines: yellow background
- Collapsible unchanged sections

---

#### ApprovalPanel
**Purpose:** Review and approve/reject code
**Features:** Diff, status, action buttons

```typescript
<ApprovalPanel
  taskId={taskId}
  onApprove={mergePR}
  onReject={requestChanges}
  status={prStatus}
/>

// Props
interface ApprovalPanelProps {
  taskId: string
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  status: 'pending' | 'approved' | 'rejected'
  prUrl?: string
}
```

**Sections**
- Status: Current approval status
- PR Link: Link to GitHub PR
- Diff Viewer: Code changes
- Comments: (optional) Comment section
- Actions: Approve/Reject buttons
- PR Info: Reviewers, branch, commit

---

#### GitHubConnect
**Purpose:** OAuth connection to GitHub
**Features:** Scopes explanation, connection status

```typescript
<GitHubConnect
  onConnected={handleGitHubConnected}
  isConnected={isGitHubConnected}
/>

// Props
interface GitHubConnectProps {
  onConnected: (user: GitHubUser) => void
  isConnected: boolean
  onDisconnect?: () => void
}
```

**Sections**
- Status: Connected/Not connected
- Connect Button: "Connect to GitHub" button
- Scopes: List of permissions requested
- User Info: If connected, show user avatar/name
- Disconnect Button: If connected

**Scopes Required**
- repo: Full control of repositories
- workflow: Manage GitHub Actions
- read:org: Read organization info

---

#### DashboardOverview
**Purpose:** Dashboard summary widgets
**Features:** Task counts, completion rate, recent activity

```typescript
<DashboardOverview />
```

**Widgets**
1. **Task Count Widget**
   - Total tasks created
   - Big number display
   - Trend indicator (↑/↓ from last week)

2. **Completion Rate Widget**
   - Success percentage
   - Progress ring visualization
   - Time range selector (7d, 30d, 90d)

3. **Recent Tasks Widget**
   - Last 5 tasks
   - Quick status view
   - Link to task detail

4. **Status Distribution Widget**
   - Pie chart: Pending, Running, Completed, Failed
   - Click to filter

5. **Quick Actions Widget**
   - Create new task button
   - View templates button
   - Settings button

---

#### WebhookConfig
**Purpose:** Webhook setup and testing
**Features:** URL display, test trigger, logs

```typescript
<WebhookConfig
  webhookUrl={url}
  onTest={testWebhook}
  logs={webhookLogs}
/>

// Props
interface WebhookConfigProps {
  webhookUrl: string
  onTest: () => Promise<void>
  logs: WebhookLog[]
  onCopy?: (text: string) => void
}
```

**Features**
- Display webhook URL
- Copy button
- Test trigger button
- Recent events log
- Event details (timestamp, payload, response)
- Clear logs button

---

## 🎯 SPACING & LAYOUT SYSTEM

### 8px Grid System
```
8px (1 unit), 16px (2), 24px (3), 32px (4), 40px (5), 48px (6)
```

### Container Sizes
- **Small:** max-width 640px
- **Medium:** max-width 768px
- **Large:** max-width 1024px
- **XL:** max-width 1280px

### Responsive Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 🎨 TYPOGRAPHY

### Font Family
```
Base: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif
Mono: "SF Mono", Monaco, "Cascadia Code", monospace
```

### Font Sizes
- h1: 32px (font-weight 700)
- h2: 24px (font-weight 600)
- h3: 20px (font-weight 600)
- h4: 16px (font-weight 600)
- body: 14px (font-weight 400)
- small: 12px (font-weight 400)
- label: 12px (font-weight 500)

### Line Heights
- Headings: 1.2
- Body: 1.5
- Compact: 1.4

---

## ⚡ ANIMATIONS

### Transitions
```
fast: 150ms ease-out
normal: 250ms ease-out
slow: 350ms ease-out
```

### Keyframes
```
fadeIn: opacity 0 → 1
slideUp: transform translateY(10px) → translateY(0)
slideDown: transform translateY(-10px) → translateY(0)
pulse: opacity 1 → 0.5 → 1 (infinite)
spin: rotate 0deg → 360deg (infinite)
```

---

## ♿ ACCESSIBILITY

### Keyboard Navigation
- Tab: Navigate between focusable elements
- Enter: Activate buttons/submit forms
- Escape: Close modals/dropdowns
- Arrow keys: Navigate lists/tabs

### Color Contrast
- Text on background: 4.5:1 (WCAG AA)
- Large text: 3:1 (WCAG AA)
- UI components: 3:1 (WCAG AA)

### ARIA Attributes
- `aria-label`: Unlabeled buttons
- `aria-describedby`: Form field errors
- `aria-expanded`: Collapsible sections
- `aria-current`: Active navigation
- `role="status"`: Live regions for updates

---

## 🌙 DARK MODE

### Implementation
- Use CSS variables with prefers-color-scheme
- Manual toggle via data-theme attribute
- Persist preference to localStorage

### Dark Mode Color Adjustments
```css
[data-theme="dark"] {
  --color-gray-50: #f8fafc
  --color-gray-100: #f1f5f9
  --color-gray-900: #0f172a
  --bg-primary: #1a1a1a
  --bg-secondary: #262626
}
```

---

## 📦 COMPONENT EXPORTS

Create an `index.tsx` in each component folder:

```typescript
// components/ui/button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'

// components/index.ts
export * from './ui/button'
export * from './ui/card'
export * from './tasks/TaskForm'
export * from './tasks/TaskList'
// ... etc
```

---

## ✅ COMPONENT CHECKLIST

For each component, ensure:

- [ ] TypeScript types defined
- [ ] Props documented with JSDoc
- [ ] Default props specified
- [ ] Keyboard navigation supported
- [ ] Accessible labels/ARIA
- [ ] Dark mode support
- [ ] Responsive design tested
- [ ] Loading states shown
- [ ] Error states shown
- [ ] Storybook story created
- [ ] Unit tests written
- [ ] Usage examples documented

---

**Component System Complete** ✅

This comprehensive system provides the foundation for building a cohesive, accessible, and beautiful Jules API UI application.

Last Updated: December 30, 2025
