import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription, tap, timer } from 'rxjs';
import { JulesService } from './jules.service';
import { SessionUtilsService } from './session-utils.service';
import { AuthTokenService } from './auth-token.service';
import { JulesApiError, Session, SessionState } from '../models/jules.model';
import { environment } from '../../environments/environment';

export interface SessionFilter {
  search?: string;
  status?: SessionState | null;
  source?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export type SortField = 'created_at' | 'title' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class SessionCacheService {
  private readonly julesService = inject(JulesService);
  private readonly sessionUtils = inject(SessionUtilsService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly platformId = inject(PLATFORM_ID);
  
  // Maximum number of sessions to fetch (configurable)
  private readonly MAX_SESSIONS = 1000;

  private readonly ssePollIntervalSeconds = 10;
  
  // Raw cached sessions
  private readonly sessions = signal<Session[]>([]);
  
  // Loading state
  readonly loading = signal<boolean>(false);

  // Error state
  readonly error = signal<string | null>(null);

  // Last updated timestamp
  readonly lastUpdated = signal<Date | null>(null);
  
  // Filter state
  readonly filter = signal<SessionFilter>({});
  
  // Sort state
  readonly sortField = signal<SortField>('created_at');
  readonly sortDirection = signal<SortDirection>('desc');
  
  // Computed filtered and sorted sessions
  readonly filteredSessions = computed(() => {
    let result = [...this.sessions()];
    const currentFilter = this.filter();
    const field = this.sortField();
    const direction = this.sortDirection();
    
    // Apply search filter
    if (currentFilter.search && currentFilter.search.trim()) {
      const searchLower = currentFilter.search.toLowerCase().trim();
      result = result.filter(session => 
        session.display_name.toLowerCase().includes(searchLower) ||
        session.prompt.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (currentFilter.status) {
      result = result.filter(session => session.state === currentFilter.status);
    }
    
    // Apply source filter
    if (currentFilter.source) {
      result = result.filter(session => session.source === currentFilter.source);
    }
    
    // Apply date range filter
    if (currentFilter.dateFrom) {
      result = result.filter(session => {
        const sessionDate = new Date(session.create_time);
        return sessionDate >= currentFilter.dateFrom!;
      });
    }
    
    if (currentFilter.dateTo) {
      result = result.filter(session => {
        const sessionDate = new Date(session.create_time);
        // Set to end of day for inclusive comparison
        const endOfDay = new Date(currentFilter.dateTo!);
        endOfDay.setHours(23, 59, 59, 999);
        return sessionDate <= endOfDay;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (field) {
        case 'title':
          aValue = a.display_name.toLowerCase();
          bValue = b.display_name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.create_time).getTime();
          bValue = new Date(b.create_time).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.update_time).getTime();
          bValue = new Date(b.update_time).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return result;
  });

  // Session counts by status
  readonly totalCount = computed(() => this.sessions().length);
  readonly activeCount = computed(() => this.sessions().filter(session => session.state === 'ACTIVE').length);
  readonly completedCount = computed(() =>
    this.sessions().filter(session => session.state === 'COMPLETED').length
  );
  readonly failedCount = computed(() => this.sessions().filter(session => session.state === 'FAILED').length);

  private autoRefreshSubscription: Subscription | null = null;
  private eventSource: EventSource | null = null;
  private lastSessionUpdateTime: string | null = null;
  
  /**
   * Load all sessions from the API (up to MAX_SESSIONS)
   */
  loadAllSessions(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    const allSessions: Session[] = [];
    let pageToken: string | null = null;
    let hasMore = true;
    
    const fetchPage = (token: string | null = null): void => {
      if (!hasMore || allSessions.length >= this.MAX_SESSIONS) {
        this.updateSessions(allSessions);
        this.loading.set(false);
        return;
      }
      
      this.julesService.getSessions(100, token).subscribe({
        next: (response) => {
          allSessions.push(...response.sessions);
          
          if (response.next_page_token && allSessions.length < this.MAX_SESSIONS) {
            fetchPage(response.next_page_token);
          } else {
            this.updateSessions(allSessions);
            this.loading.set(false);
            hasMore = false;
          }
        },
        error: (err: JulesApiError) => {
          this.error.set(this.julesService.getErrorMessage(err, 'Failed to load sessions'));
          this.loading.set(false);
        }
      });
    };
    
    fetchPage();
  }
  
  /**
   * Refresh sessions from API
   */
  refresh(): void {
    this.loadAllSessions();
  }

  /**
   * Start polling for session updates
   */
  startAutoRefresh(intervalMs = 15000): void {
    this.startLiveUpdates();
    if (this.autoRefreshSubscription) {
      return;
    }

    this.autoRefreshSubscription = timer(0, intervalMs).subscribe(() => {
      this.loadAllSessions();
    });
  }

  startLiveUpdates(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.authTokenService.getToken();
    if (!token || this.eventSource) {
      return;
    }

    const params = new URLSearchParams({
      token,
      poll_interval: this.ssePollIntervalSeconds.toString()
    });

    if (this.lastSessionUpdateTime) {
      params.set('last_update', this.lastSessionUpdateTime);
    }

    const streamUrl = `${environment.apiUrl}/jules/sessions/events/?${params.toString()}`;
    this.eventSource = new EventSource(streamUrl);

    this.eventSource.addEventListener('sessions_update', event => {
      const data = JSON.parse((event as MessageEvent).data) as Session[];
      this.updateSessions(data);
    });

    this.eventSource.addEventListener('error', () => {
      this.eventSource?.close();
      this.eventSource = null;
    });
  }

  /**
   * Stop polling for session updates
   */
  stopAutoRefresh(): void {
    this.autoRefreshSubscription?.unsubscribe();
    this.autoRefreshSubscription = null;
    this.eventSource?.close();
    this.eventSource = null;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): Observable<void> {
    return this.julesService.deleteSession(sessionId).pipe(
      tap(() => {
        this.sessions.update(current =>
          current.filter(s => {
            const id = this.sessionUtils.extractSessionId(s.name);
            return id !== sessionId;
          })
        );
      })
    );
  }
  
  /**
   * Update filter criteria
   */
  setFilter(filter: Partial<SessionFilter>): void {
    this.filter.set({ ...this.filter(), ...filter });
  }
  
  /**
   * Clear all filters
   */
  clearFilter(): void {
    this.filter.set({});
  }
  
  /**
   * Set sort field and direction
   */
  setSort(field: SortField, direction: SortDirection = 'desc'): void {
    this.sortField.set(field);
    this.sortDirection.set(direction);
  }
  
  /**
   * Toggle sort direction for current field
   */
  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.setSort(field, 'desc');
    }
  }
  
  /**
   * Get unique sources from cached sessions
   */
  readonly uniqueSources = computed(() => {
    const sources = new Set<string>();
    this.sessions().forEach(session => {
      if (session.source) {
        sources.add(session.source);
      }
    });
    return Array.from(sources).sort();
  });

  /**
   * Get filtered count
   */
  readonly filteredCount = computed(() => this.filteredSessions().length);

  private updateSessions(sessions: Session[]): void {
    this.sessions.set(sessions);
    this.lastUpdated.set(new Date());
    this.lastSessionUpdateTime = this.getLatestUpdateTime(sessions);
  }

  private getLatestUpdateTime(sessions: Session[]): string | null {
    if (sessions.length === 0) {
      return null;
    }

    return sessions.reduce<string | null>((latest, session) => {
      if (!session.update_time) {
        return latest;
      }
      if (!latest || session.update_time > latest) {
        return session.update_time;
      }
      return latest;
    }, null);
  }
}
