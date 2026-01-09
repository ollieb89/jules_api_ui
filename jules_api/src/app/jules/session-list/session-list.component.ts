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
import { getApiErrorMessage } from '../../utils/api-error';

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
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">Jules Sessions</h1>
        <div class="flex gap-3">
          <a
            routerLink="/dashboard"
            class="px-4 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold rounded-lg transition-colors hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            Dashboard
          </a>
          <a
            routerLink="/jules/settings"
            class="px-4 py-2 bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            ⚙️ Settings
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
          <button
            (click)="createSession()"
            type="button"
            aria-label="Create new session"
            class="bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] active:bg-[var(--color-interactive-primary-active)] text-[var(--color-text-inverse)] font-semibold py-2 px-4 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            New Session
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Search
            </label>
            <div class="relative">
              <input
                id="search"
                type="text"
                [(ngModel)]="searchInput"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search by title or prompt..."
                class="w-full pl-3 pr-10 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
              />
              @if (searchInput()) {
                <button
                  (click)="onSearchChange('')"
                  type="button"
                  aria-label="Clear search"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              }
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label for="status" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Status
            </label>
            <select
              id="status"
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onStatusChange($event)"
              class="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              <option [value]="null">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <!-- Source Filter -->
          <div>
            <label for="source" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Source
            </label>
            <select
              id="source"
              [(ngModel)]="selectedSource"
              (ngModelChange)="onSourceChange($event)"
              class="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              <option [value]="null">All Sources</option>
              @for (source of cacheService.uniqueSources(); track source) {
                <option [value]="source">{{ source }}</option>
              }
            </select>
          </div>

          <!-- Sort -->
          <div>
            <label for="sort" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Sort By
            </label>
            <div class="flex gap-2">
              <select
                id="sort"
                [(ngModel)]="sortField"
                (ngModelChange)="onSortFieldChange($event)"
                class="flex-1 px-3 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
              >
                <option value="created_at">Created Date</option>
                <option value="title">Title</option>
                <option value="updated_at">Updated Date</option>
              </select>
              <button
                (click)="toggleSortDirection()"
                type="button"
                aria-label="Toggle sort direction"
                class="px-3 py-2 border border-[var(--color-border-default)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
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
              class="text-sm text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Clear all filters
            </button>
          </div>
        }
      </div>

      <!-- Results Count -->
      <div class="mb-4 flex flex-col gap-1 text-sm text-[var(--color-text-secondary)]">
        <span>Showing {{ cacheService.filteredCount() }} of {{ cacheService.totalCount() }} sessions</span>
        <span>{{ lastUpdatedLabel() }}</span>
      </div>

      <!-- Loading State -->
      @if (cacheService.loading() && cacheService.totalCount() === 0) {
        <div class="flex justify-center items-center py-12" aria-busy="true" aria-live="polite">
          <div class="text-[var(--color-text-secondary)]">Loading sessions...</div>
        </div>
      }

      <!-- Error State -->
      @if (cacheService.error()) {
        <div 
          class="bg-[var(--color-error-50)] border border-[var(--color-error-200)] text-[var(--color-error-700)] px-4 py-3 rounded mb-4"
          role="alert"
          aria-live="assertive"
        >
          {{ cacheService.error() }}
        </div>
        <button
          (click)="cacheService.refresh()"
          type="button"
          aria-label="Retry loading sessions"
          class="bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] text-[var(--color-text-inverse)] font-semibold py-2 px-4 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
        >
          Retry
        </button>
      }

      <!-- Empty State -->
      @if (!cacheService.loading() && cacheService.filteredCount() === 0 && cacheService.totalCount() === 0) {
        <div class="bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg p-8 text-center">
          <p class="text-[var(--color-text-secondary)] mb-4">No sessions found.</p>
          <button
            (click)="createSession()"
            type="button"
            aria-label="Create first session"
            class="bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] text-[var(--color-text-inverse)] font-semibold py-2 px-4 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            Create First Session
          </button>
        </div>
      }

      <!-- No Results After Filtering -->
      @if (!cacheService.loading() && cacheService.filteredCount() === 0 && cacheService.totalCount() > 0) {
        <div class="bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg p-8 text-center">
          <p class="text-[var(--color-text-secondary)] mb-4">No sessions match your filters.</p>
          <button
            (click)="clearFilters()"
            type="button"
            class="text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            Clear filters
          </button>
        </div>
      }

      <!-- Session Grid -->
      @if (cacheService.filteredCount() > 0) {
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg overflow-hidden">
          <div 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[600px] overflow-y-auto"
          >
            @for (session of formattedSessions(); track session.name) {
              <div class="bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold text-[var(--color-text-primary)] flex-1">
                    {{ session.display_name }}
                  </h3>
                  <span 
                    [class]="'px-2 py-1 rounded-full text-xs font-medium ' + session.stateBadgeClass"
                  >
                    {{ getStateLabel(session.state) }}
                  </span>
                </div>
                
                <p class="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                  {{ session.prompt }}
                </p>
                
                <div class="flex flex-wrap gap-2 text-xs text-[var(--color-text-tertiary)] mb-3">
                  <span>Source: {{ session.source }}</span>
                  <span>Created: {{ session.formattedCreateTime }}</span>
                </div>
                
                <div class="flex gap-2">
                  <button
                    (click)="viewSession(session.name)"
                    type="button"
                    [aria-label]="'View session ' + session.display_name"
                    class="flex-1 text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] font-medium text-sm py-1 px-2 rounded hover:bg-[var(--color-info-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                  >
                    View
                  </button>
                  @if (session.state === 'ACTIVE') {
                    <button
                      (click)="sendMessage(session.name)"
                      type="button"
                      [aria-label]="'Send message to session ' + session.display_name"
                      class="text-[var(--color-success-700)] hover:text-[var(--color-success-800)] font-medium text-sm py-1 px-2 rounded hover:bg-[var(--color-success-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                    >
                      Message
                    </button>
                  }
                  <button
                    (click)="deleteSession(session.name)"
                    type="button"
                    [aria-label]="'Delete session ' + session.display_name"
                    class="text-[var(--color-error-700)] hover:text-[var(--color-error-800)] font-medium text-sm py-1 px-2 rounded hover:bg-[var(--color-error-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
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
      
      let stateBadgeClass = 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]';
      if (session.state === 'ACTIVE') {
        stateBadgeClass = 'bg-[var(--color-info-50)] text-[var(--color-info-800)]';
      } else if (session.state === 'COMPLETED') {
        stateBadgeClass = 'bg-[var(--color-success-50)] text-[var(--color-success-800)]';
      } else if (session.state === 'FAILED') {
        stateBadgeClass = 'bg-[var(--color-error-50)] text-[var(--color-error-800)]';
      }

      return {
        ...session,
        formattedCreateTime: createTime.toLocaleString(),
        formattedUpdateTime: updateTime.toLocaleString(),
        stateBadgeClass
      };
    });
  });

  lastUpdatedLabel = computed(() => {
    const lastUpdated = this.cacheService.lastUpdated();
    if (!lastUpdated) {
      return 'Live updates will appear here.';
    }
    return `Last updated ${lastUpdated.toLocaleTimeString()}`;
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
    this.cacheService.startAutoRefresh();
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
        error: (err: unknown) => {
          this.cacheService.error.set(getApiErrorMessage(err, 'Failed to delete session'));
          this.confirmationDialog.reset();
        }
      });
    }
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
