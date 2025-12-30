import { Component, OnInit, signal, ChangeDetectionStrategy, inject, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { SessionCacheService, SortField } from '../../services/session-cache.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { SessionUtilsService } from '../../services/session-utils.service';
import { Session, SessionState } from '../../models/jules.model';

interface FormattedSession extends Session {
  formattedCreateTime: string;
  formattedUpdateTime: string;
  stateBadgeClass: string;
}

@Component({
  selector: 'app-session-list',
  imports: [CommonModule, RouterModule, FormsModule, ConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Jules Sessions</h1>
        <div class="flex gap-3">
          <a
            routerLink="/jules/settings"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            ⚙️ Settings
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
          <button
            (click)="createSession()"
            type="button"
            aria-label="Create new session"
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            New Session
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div class="relative">
              <input
                id="search"
                type="text"
                [(ngModel)]="searchInput"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search by title or prompt..."
                class="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              @if (searchInput()) {
                <button
                  (click)="onSearchChange('')"
                  type="button"
                  aria-label="Clear search"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              }
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onStatusChange($event)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option [value]="null">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <!-- Source Filter -->
          <div>
            <label for="source" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source
            </label>
            <select
              id="source"
              [(ngModel)]="selectedSource"
              (ngModelChange)="onSourceChange($event)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option [value]="null">All Sources</option>
              @for (source of cacheService.uniqueSources(); track source) {
                <option [value]="source">{{ source }}</option>
              }
            </select>
          </div>

          <!-- Sort -->
          <div>
            <label for="sort" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <div class="flex gap-2">
              <select
                id="sort"
                [(ngModel)]="sortField"
                (ngModelChange)="onSortFieldChange($event)"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at">Created Date</option>
                <option value="title">Title</option>
                <option value="updated_at">Updated Date</option>
              </select>
              <button
                (click)="toggleSortDirection()"
                type="button"
                aria-label="Toggle sort direction"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                @if (cacheService.sortDirection() === 'asc') {
                  ↑
                } @else {
                  ↓
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Clear Filters -->
        @if (hasActiveFilters()) {
          <div class="mt-4">
            <button
              (click)="clearFilters()"
              type="button"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          </div>
        }
      </div>

      <!-- Results Count -->
      <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {{ cacheService.filteredCount() }} of {{ cacheService.totalCount() }} sessions
      </div>

      <!-- Loading State -->
      @if (cacheService.loading() && cacheService.totalCount() === 0) {
        <div class="flex justify-center items-center py-12" aria-busy="true" aria-live="polite">
          <div class="text-gray-600 dark:text-gray-400">Loading sessions...</div>
        </div>
      }

      <!-- Error State -->
      @if (cacheService.error()) {
        <div 
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
          role="alert"
          aria-live="assertive"
        >
          {{ cacheService.error() }}
        </div>
        <button
          (click)="cacheService.refresh()"
          type="button"
          aria-label="Retry loading sessions"
          class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Retry
        </button>
      }

      <!-- Empty State -->
      @if (!cacheService.loading() && cacheService.filteredCount() === 0 && cacheService.totalCount() === 0) {
        <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p class="text-gray-600 dark:text-gray-400 mb-4">No sessions found.</p>
          <button
            (click)="createSession()"
            type="button"
            aria-label="Create first session"
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Create First Session
          </button>
        </div>
      }

      <!-- No Results After Filtering -->
      @if (!cacheService.loading() && cacheService.filteredCount() === 0 && cacheService.totalCount() > 0) {
        <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p class="text-gray-600 dark:text-gray-400 mb-4">No sessions match your filters.</p>
          <button
            (click)="clearFilters()"
            type="button"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear filters
          </button>
        </div>
      }

      <!-- Session Grid -->
      @if (cacheService.filteredCount() > 0) {
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[600px] overflow-y-auto"
          >
            @for (session of formattedSessions(); track session.name) {
              <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {{ session.display_name }}
                  </h3>
                  <span 
                    [class]="'px-2 py-1 rounded-full text-xs font-medium ' + session.stateBadgeClass"
                  >
                    {{ getStateLabel(session.state) }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {{ session.prompt }}
                </p>
                
                <div class="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-500 mb-3">
                  <span>Source: {{ session.source }}</span>
                  <span>Created: {{ session.formattedCreateTime }}</span>
                </div>
                
                <div class="flex gap-2">
                  <button
                    (click)="viewSession(session.name)"
                    type="button"
                    [aria-label]="'View session ' + session.display_name"
                    class="flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium text-sm py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    View
                  </button>
                  @if (session.state === 'ACTIVE') {
                    <button
                      (click)="sendMessage(session.name)"
                      type="button"
                      [aria-label]="'Send message to session ' + session.display_name"
                      class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-medium text-sm py-1 px-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      Message
                    </button>
                  }
                  <button
                    (click)="deleteSession(session.name)"
                    type="button"
                    [aria-label]="'Delete session ' + session.display_name"
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium text-sm py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <app-confirmation-dialog
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="onDeleteCancelled()"
      ></app-confirmation-dialog>
    </div>
  `
})
export class SessionListComponent implements OnInit {
  readonly cacheService = inject(SessionCacheService);
  readonly themeService = inject(ThemeService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private confirmDialogService = inject(ConfirmDialogService);
  private sessionUtils = inject(SessionUtilsService);

  @ViewChild(ConfirmationDialogComponent) confirmationDialog!: ConfirmationDialogComponent;

  // Search input with debounce
  searchInput = signal<string>('');
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Filter state
  selectedStatus = signal<SessionState | null>(null);
  selectedSource = signal<string | null>(null);
  sortField = signal<SortField>('created_at');

  // Formatted sessions for display
  formattedSessions = computed<FormattedSession[]>(() => {
    return this.cacheService.filteredSessions().map(session => {
      const createTime = new Date(session.create_time);
      const updateTime = new Date(session.update_time);
      
      let stateBadgeClass = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      if (session.state === 'ACTIVE') {
        stateBadgeClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      } else if (session.state === 'COMPLETED') {
        stateBadgeClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      } else if (session.state === 'FAILED') {
        stateBadgeClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      }

      return {
        ...session,
        formattedCreateTime: createTime.toLocaleString(),
        formattedUpdateTime: updateTime.toLocaleString(),
        stateBadgeClass
      };
    });
  });

  constructor() {
    // Initialize search input from filter
    effect(() => {
      const filter = this.cacheService.filter();
      if (filter.search !== this.searchInput()) {
        this.searchInput.set(filter.search || '');
      }
    });
  }

  ngOnInit(): void {
    this.cacheService.loadAllSessions();
  }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    
    // Debounce search (300ms)
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    this.searchDebounceTimer = setTimeout(() => {
      this.cacheService.setFilter({ search: value || undefined });
    }, 300);
  }

  onStatusChange(status: SessionState | null): void {
    this.selectedStatus.set(status);
    this.cacheService.setFilter({ status: status || undefined });
  }

  onSourceChange(source: string | null): void {
    this.selectedSource.set(source);
    this.cacheService.setFilter({ source: source || undefined });
  }

  onSortFieldChange(field: SortField): void {
    this.sortField.set(field);
    this.cacheService.setSort(field, this.cacheService.sortDirection());
  }

  toggleSortDirection(): void {
    this.cacheService.toggleSort(this.cacheService.sortField());
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.selectedStatus.set(null);
    this.selectedSource.set(null);
    this.cacheService.clearFilter();
  }

  hasActiveFilters(): boolean {
    const filter = this.cacheService.filter();
    return !!(filter.search || filter.status || filter.source || filter.dateFrom || filter.dateTo);
  }

  createSession(): void {
    this.router.navigate(['/jules/create']);
  }

  viewSession(sessionName: string): void {
    const id = this.sessionUtils.extractSessionId(sessionName);
    this.router.navigate(['/jules', id]);
  }

  sendMessage(sessionName: string): void {
    const id = this.sessionUtils.extractSessionId(sessionName);
    this.router.navigate(['/jules', id], { queryParams: { action: 'message' } });
  }

  // Delete state
  sessionToDelete = signal<string | null>(null);

  deleteSession(sessionId: string): void {
    this.sessionToDelete.set(sessionId);
    // Find session name/title for better UX
    const session = this.cacheService.filteredSessions().find(s => s.name === sessionId);
    const sessionName = session ? session.display_name : 'this session';

    this.confirmationDialog.title = 'Delete Session';
    this.confirmationDialog.message = `Are you sure you want to delete "${sessionName}"? This action cannot be undone.`;
    this.confirmationDialog.confirmText = 'Delete';
    this.confirmationDialog.showModal();
  }

  onDeleteConfirmed(): void {
    const sessionId = this.sessionToDelete();
    if (sessionId) {
      this.cacheService.deleteSession(sessionId).subscribe({
        next: () => {
          this.confirmationDialog.reset();
          this.sessionToDelete.set(null);
        },
        error: (err) => {
          this.cacheService.error.set(err.message || 'Failed to delete session');
          this.confirmationDialog.reset();
        }
      });
  }

  onDeleteCancelled(): void {
    this.sessionToDelete.set(null);
  }

  getStateLabel(state: SessionState): string {
    const labels: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'Pending',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    return labels[state] || state;
  }
}
