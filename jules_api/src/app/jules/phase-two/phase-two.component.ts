import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface PullRequestSummary {
  id: string;
  title: string;
  repository: string;
  branch: string;
  reviewers: string[];
  status: 'open' | 'merged' | 'closed';
  updatedAt: string;
}

interface DiffLine {
  line: number;
  before: string;
  after: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  language: string;
  tags: string[];
  lastUsed: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  status: 'active' | 'paused';
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastDelivery: string;
  status: 'healthy' | 'degraded';
}

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

interface TaskHistoryItem {
  id: string;
  title: string;
  type: string;
  status: 'completed' | 'failed' | 'canceled';
  duration: string;
  createdAt: string;
  source: string;
}

@Component({
  selector: 'app-phase-two',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phase-two.component.html',
  styleUrl: './phase-two.component.css'
})
export class PhaseTwoComponent {
  readonly githubConnected = signal<boolean>(true);

  readonly pullRequests = signal<PullRequestSummary[]>([
    {
      id: 'pr-1042',
      title: 'Improve task retry handling for long-running sessions',
      repository: 'jules-api-ui',
      branch: 'feature/retry-handling',
      reviewers: ['alex', 'jordan'],
      status: 'open',
      updatedAt: 'Today · 9:12 AM'
    },
    {
      id: 'pr-1037',
      title: 'Add activity timeline filters to session detail',
      repository: 'jules-api-ui',
      branch: 'feature/activity-filters',
      reviewers: ['sam'],
      status: 'merged',
      updatedAt: 'Yesterday · 4:40 PM'
    },
    {
      id: 'pr-1031',
      title: 'Refine dashboard KPI cards and empty states',
      repository: 'jules-api-ui',
      branch: 'design/dashboard-kpis',
      reviewers: ['taylor', 'morgan'],
      status: 'closed',
      updatedAt: 'Mon · 2:15 PM'
    }
  ]);

  readonly diffLines = signal<DiffLine[]>([
    { line: 18, before: 'const isRetryable = status === 502', after: 'const isRetryable = [502, 503].includes(status)', type: 'modified' },
    { line: 19, before: 'retryAfter = 1000', after: 'retryAfter = Math.min(retryAfter * 1.5, 8000)', type: 'modified' },
    { line: 20, before: 'logger.info("Retrying request")', after: 'logger.info("Retrying request with backoff")', type: 'modified' },
    { line: 21, before: '', after: 'metrics.track("task_retry", { status })', type: 'added' },
    { line: 22, before: 'return await request()', after: 'return await request()', type: 'unchanged' }
  ]);

  readonly reviewStatus = signal<'pending' | 'approved' | 'changes_requested'>('pending');

  readonly templates = signal<TemplateSummary[]>([
    {
      id: 'template-001',
      name: 'API Endpoint Refactor',
      description: 'Standardize route handlers, add request validation, and update service tests.',
      language: 'TypeScript',
      tags: ['backend', 'validation'],
      lastUsed: '3 days ago'
    },
    {
      id: 'template-002',
      name: 'Frontend UX Polish',
      description: 'Improve layout spacing, add empty states, and refine interactive states.',
      language: 'Angular',
      tags: ['ui', 'accessibility'],
      lastUsed: '1 week ago'
    },
    {
      id: 'template-003',
      name: 'CI Pipeline Setup',
      description: 'Add lint, typecheck, and unit tests to GitHub Actions workflow.',
      language: 'YAML',
      tags: ['devops'],
      lastUsed: '2 weeks ago'
    }
  ]);

  readonly scheduledTasks = signal<ScheduledTask[]>([
    {
      id: 'schedule-001',
      name: 'Nightly regression tasks',
      schedule: 'Weekdays · 1:00 AM',
      nextRun: 'Tonight · 1:00 AM',
      status: 'active'
    },
    {
      id: 'schedule-002',
      name: 'Monday backlog grooming',
      schedule: 'Mon · 9:00 AM',
      nextRun: 'Next Mon · 9:00 AM',
      status: 'active'
    },
    {
      id: 'schedule-003',
      name: 'Weekly reporting bundle',
      schedule: 'Fri · 3:30 PM',
      nextRun: 'Fri · 3:30 PM',
      status: 'paused'
    }
  ]);

  readonly webhooks = signal<WebhookConfig[]>([
    {
      id: 'webhook-001',
      name: 'CI Status Updates',
      url: 'https://hooks.example.com/jules/ci-status',
      events: ['task.completed', 'task.failed'],
      enabled: true,
      lastDelivery: 'Today · 8:52 AM',
      status: 'healthy'
    },
    {
      id: 'webhook-002',
      name: 'Deployment Trigger',
      url: 'https://hooks.example.com/jules/deploy',
      events: ['task.approved'],
      enabled: true,
      lastDelivery: 'Yesterday · 5:12 PM',
      status: 'healthy'
    },
    {
      id: 'webhook-003',
      name: 'Audit Trail',
      url: 'https://hooks.example.com/jules/audit',
      events: ['task.created', 'task.updated'],
      enabled: false,
      lastDelivery: 'Last week · 2:32 PM',
      status: 'degraded'
    }
  ]);

  readonly apiKeys = signal<ApiKeyRecord[]>([
    {
      id: 'key-001',
      name: 'CLI Integration',
      prefix: 'jules_live_1a2b',
      createdAt: 'Jan 12 · 2025',
      lastUsed: '2 hours ago',
      status: 'active'
    },
    {
      id: 'key-002',
      name: 'Staging Automations',
      prefix: 'jules_live_3c4d',
      createdAt: 'Dec 19 · 2024',
      lastUsed: '3 days ago',
      status: 'active'
    }
  ]);

  readonly historyItems = signal<TaskHistoryItem[]>([
    {
      id: 'hist-001',
      title: 'Refactor webhook retry logic',
      type: 'Template',
      status: 'completed',
      duration: '12m 18s',
      createdAt: 'Today · 7:24 AM',
      source: 'GitHub / jules-api-ui'
    },
    {
      id: 'hist-002',
      title: 'Generate PR for backlog cleanup',
      type: 'Manual',
      status: 'failed',
      duration: '4m 02s',
      createdAt: 'Yesterday · 6:45 PM',
      source: 'GitHub / jules-backend'
    },
    {
      id: 'hist-003',
      title: 'Schedule analytics export',
      type: 'Scheduled',
      status: 'completed',
      duration: '9m 44s',
      createdAt: 'Yesterday · 1:05 PM',
      source: 'API / Analytics'
    },
    {
      id: 'hist-004',
      title: 'Create task template for TypeScript migrations',
      type: 'Template',
      status: 'canceled',
      duration: '0m 38s',
      createdAt: 'Mon · 11:18 AM',
      source: 'Dashboard'
    }
  ]);

  readonly historyQuery = signal<string>('');
  readonly historyStatus = signal<'all' | 'completed' | 'failed' | 'canceled'>('all');

  readonly filteredHistory = computed(() => {
    const query = this.historyQuery().trim().toLowerCase();
    const status = this.historyStatus();

    return this.historyItems().filter(item => {
      const matchesQuery = query.length === 0 || item.title.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || item.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  toggleWebhook(id: string): void {
    this.webhooks.update(items =>
      items.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }

  addApiKey(): void {
    const nextId = `key-${String(this.apiKeys().length + 1).padStart(3, '0')}`;
    const newKey: ApiKeyRecord = {
      id: nextId,
      name: 'New Integration',
      prefix: `jules_live_${Math.random().toString(16).slice(2, 6)}`,
      createdAt: 'Just now',
      lastUsed: 'Never',
      status: 'active'
    };

    this.apiKeys.update(keys => [newKey, ...keys]);
  }

  revokeApiKey(id: string): void {
    this.apiKeys.update(keys =>
      keys.map(key => (key.id === id ? { ...key, status: 'revoked', lastUsed: 'Revoked' } : key))
    );
  }

  setReviewStatus(status: 'pending' | 'approved' | 'changes_requested'): void {
    this.reviewStatus.set(status);
  }

  onHistoryQueryChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.historyQuery.set(target?.value ?? '');
  }

  onHistoryStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value as 'all' | 'completed' | 'failed' | 'canceled';
    this.historyStatus.set(value ?? 'all');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
      case 'open':
      case 'active':
      case 'completed':
        return 'bg-[var(--color-success-50)] text-[var(--color-success-800)]';
      case 'merged':
        return 'bg-[var(--color-secondary-50)] text-[var(--color-secondary-800)]';
      case 'failed':
      case 'closed':
      case 'changes_requested':
        return 'bg-[var(--color-error-50)] text-[var(--color-error-800)]';
      case 'canceled':
      case 'revoked':
        return 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]';
      case 'paused':
        return 'bg-[var(--color-warning-50)] text-[var(--color-warning-800)]';
      default:
        return 'bg-[var(--color-info-50)] text-[var(--color-info-800)]';
    }
  }

  getReviewStatusLabel(): string {
    switch (this.reviewStatus()) {
      case 'approved':
        return 'Approved';
      case 'changes_requested':
        return 'Changes requested';
      default:
        return 'Pending review';
    }
  }
}
