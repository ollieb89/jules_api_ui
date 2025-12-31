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
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Track Jules sessions with live updates and quick access actions.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/jules/create"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            New Task
          </a>
          <a
            routerLink="/jules"
            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Recent Tasks
          </a>
          <button
            (click)="themeService.toggle()"
            type="button"
            aria-label="Toggle theme"
            class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Tasks</p>
          <p class="text-3xl font-semibold text-blue-600 dark:text-blue-400">{{ activeCount() }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ lastUpdatedLabel() }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p class="text-3xl font-semibold text-green-600 dark:text-green-400">{{ completedCount() }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Completion rate {{ completionRateLabel() }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Failed</p>
          <p class="text-3xl font-semibold text-red-600 dark:text-red-400">{{ failedCount() }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Needs attention</p>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p class="text-3xl font-semibold text-gray-900 dark:text-gray-100">{{ totalCount() }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Across all sources</p>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Completion Rate</h2>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ completionRateLabel() }}</span>
          </div>
          <div class="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              class="h-full bg-green-500 transition-all"
              [style.width.%]="completionRate()"
              [attr.aria-valuenow]="completionRate()"
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
            ></div>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p class="font-medium text-gray-800 dark:text-gray-200">{{ completedCount() }}</p>
              <p>Completed</p>
            </div>
            <div>
              <p class="font-medium text-gray-800 dark:text-gray-200">{{ activeCount() }}</p>
              <p>Active</p>
            </div>
            <div>
              <p class="font-medium text-gray-800 dark:text-gray-200">{{ failedCount() }}</p>
              <p>Failed</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div class="flex flex-col gap-3 text-sm">
            <a
              routerLink="/jules/create"
              class="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              Create a new Jules task
            </a>
            <a
              routerLink="/jules"
              class="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Review recent tasks
            </a>
            <a
              routerLink="/jules/settings"
              class="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Configure API settings
            </a>
            <a
              routerLink="/jules/integrations"
              class="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Phase 2 integrations
            </a>
          </div>
          <div class="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Live updates stream continuously with a minute fallback refresh.
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
