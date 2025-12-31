import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionCacheService } from '../../services/session-cache.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8">
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Track Jules sessions with live updates and quick access actions.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/jules/create"
            class="px-4 py-2 bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] active:bg-[var(--color-interactive-primary-active)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            New Task
          </a>
          <a
            routerLink="/jules"
            class="px-4 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold rounded-lg transition-colors hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            Recent Tasks
          </a>
          <button
            (click)="themeService.toggle()"
            type="button"
            aria-label="Toggle theme"
            class="p-2 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            @if (themeService.getTheme() === 'dark') {
              ☀️
            } @else {
              🌙
            }
          </button>
        </div>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-5">
          <p class="text-sm text-[var(--color-text-tertiary)]">Active Tasks</p>
          <p class="text-3xl font-semibold text-[var(--color-info-700)]">{{ activeCount() }}</p>
          <p class="text-xs text-[var(--color-text-tertiary)] mt-2">{{ lastUpdatedLabel() }}</p>
        </div>
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-5">
          <p class="text-sm text-[var(--color-text-tertiary)]">Completed</p>
          <p class="text-3xl font-semibold text-[var(--color-success-700)]">{{ completedCount() }}</p>
          <p class="text-xs text-[var(--color-text-tertiary)] mt-2">Completion rate {{ completionRateLabel() }}</p>
        </div>
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-5">
          <p class="text-sm text-[var(--color-text-tertiary)]">Failed</p>
          <p class="text-3xl font-semibold text-[var(--color-error-700)]">{{ failedCount() }}</p>
          <p class="text-xs text-[var(--color-text-tertiary)] mt-2">Needs attention</p>
        </div>
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-5">
          <p class="text-sm text-[var(--color-text-tertiary)]">Total Tasks</p>
          <p class="text-3xl font-semibold text-[var(--color-text-primary)]">{{ totalCount() }}</p>
          <p class="text-xs text-[var(--color-text-tertiary)] mt-2">Across all sources</p>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Task Completion Rate</h2>
            <span class="text-sm text-[var(--color-text-tertiary)]">{{ completionRateLabel() }}</span>
          </div>
          <div class="h-3 rounded-full bg-[var(--color-background-tertiary)] overflow-hidden">
            <div
              class="h-full bg-[var(--color-state-success)] transition-all"
              [style.width.%]="completionRate()"
              [attr.aria-valuenow]="completionRate()"
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
            ></div>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-4 text-sm text-[var(--color-text-secondary)]">
            <div>
              <p class="font-medium text-[var(--color-text-primary)]">{{ completedCount() }}</p>
              <p>Completed</p>
            </div>
            <div>
              <p class="font-medium text-[var(--color-text-primary)]">{{ activeCount() }}</p>
              <p>Active</p>
            </div>
            <div>
              <p class="font-medium text-[var(--color-text-primary)]">{{ failedCount() }}</p>
              <p>Failed</p>
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6">
          <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
          <div class="flex flex-col gap-3 text-sm">
            <a
              routerLink="/jules/create"
              class="px-4 py-2 rounded-lg bg-[var(--color-info-50)] text-[var(--color-info-700)] font-semibold hover:bg-[var(--color-info-100)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Create a new Jules task
            </a>
            <a
              routerLink="/jules"
              class="px-4 py-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Review recent tasks
            </a>
            <a
              routerLink="/jules/settings"
              class="px-4 py-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Configure API settings
            </a>
            <a
              routerLink="/jules/integrations"
              class="px-4 py-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Phase 2 integrations
            </a>
          </div>
          <div class="mt-6 text-xs text-[var(--color-text-tertiary)]">
            Live updates stream continuously and refresh every 15 seconds.
          </div>
        </div>
      </section>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  readonly cacheService = inject(SessionCacheService);
  readonly themeService = inject(ThemeService);

  readonly totalCount = computed(() => this.cacheService.totalCount());
  readonly activeCount = computed(() => this.cacheService.activeCount());
  readonly completedCount = computed(() => this.cacheService.completedCount());
  readonly failedCount = computed(() => this.cacheService.failedCount());

  readonly completionRate = computed(() => {
    const total = this.cacheService.totalCount();
    if (total === 0) {
      return 0;
    }
    return Math.round((this.cacheService.completedCount() / total) * 100);
  });

  readonly completionRateLabel = computed(() => `${this.completionRate()}%`);

  readonly lastUpdatedLabel = computed(() => {
    const lastUpdated = this.cacheService.lastUpdated();
    if (!lastUpdated) {
      return 'Awaiting first update';
    }
    return `Last updated ${lastUpdated.toLocaleTimeString()}`;
  });

  ngOnInit(): void {
    this.cacheService.startAutoRefresh();
  }
}
