import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription, tap, timer } from 'rxjs';
import { JulesService } from './jules.service';
import { SessionUtilsService } from './session-utils.service';
import { AuthTokenService } from './auth-token.service';
import { JulesStreamService } from './jules-stream.service';
import { JulesApiError, Session, SessionState, Source } from '../models/jules.model';
import { getApiErrorMessage } from '../utils/api-error';
import { getParserErrorMessage, parseSessionsResponse } from '../utils/api-parsers';

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
  private readonly streamService = inject(JulesStreamService);
  private readonly platformId = inject(PLATFORM_ID);

  // Maximum number of sessions to fetch (configurable)
  private readonly MAX_SESSIONS = 1000;

  private readonly ssePollIntervalSeconds = 60;

  // Raw cached sessions
  readonly sessions = signal<Session[]>([]);

  // Loading state
  readonly loading = signal<boolean>(false);

  // Error state
  readonly error = signal<string | null>(null);

  // Sources (for filter display names)
  readonly sources = signal<Source[]>([]);
  readonly sourcesLoading = signal<boolean>(false);
  readonly sourcesError = signal<string | null>(null);

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
  readonly activeCount = computed(() => this.sessions().filter(
    session => ['ACTIVE', 'IN_PROGRESS', 'AWAITING_USER_FEEDBACK'].includes(session.state)
  ).length);
  readonly completedCount = computed(() =>
    this.sessions().filter(session => session.state === 'COMPLETED').length
  );
  readonly failedCount = computed(() => this.sessions().filter(session => session.state === 'FAILED').length);

  // Map of source name to display name for efficient lookup
  readonly sourceMap = computed(() => {
    const map = new Map<string, string>();
    this.sources().forEach(source => {
      map.set(source.name, source.display_name);
    });
    return map;
  });

  private autoRefreshSubscription: Subscription | null = null;
  private streamSubscription: Subscription | null = null;
  private lastSessionUpdateTime: string | null = null;
  private streamConnected = signal<boolean>(false);

  /**
   * Load all sessions from the API (up to MAX_SESSIONS)
   */
  loadAllSessions(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const allSessions: Session[] = [];
    // const pageToken: string | null = null;
    let hasMore = true;

    const fetchPage = (token: string | null = null): void => {
      if (!hasMore || allSessions.length >= this.MAX_SESSIONS) {
        this.updateSessions(allSessions);
        this.loading.set(false);
        return;
      }

      this.julesService.getSessions(100, token).subscribe({
        next: (response) => {
          try {
            const parsed = parseSessionsResponse(response);
            allSessions.push(...parsed.sessions);

            if (parsed.next_page_token && allSessions.length < this.MAX_SESSIONS) {
              fetchPage(parsed.next_page_token);
            } else {
              this.updateSessions(allSessions);
              this.loading.set(false);
              hasMore = false;
            }
          } catch (error) {
            this.error.set(getParserErrorMessage(error, 'Invalid sessions response.'));
            this.loading.set(false);
            hasMore = false;
          }
        },
        error: (err: JulesApiError) => {
          this.error.set(getApiErrorMessage(err, 'Failed to load sessions'));
          this.loading.set(false);
        }
      });
    };

    fetchPage();
  }

  /**
   * Load available sources from the API
   */
  loadSources(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.sourcesLoading()) {
      return;
    }

    this.sourcesLoading.set(true);
    this.sourcesError.set(null);

    this.julesService.getSources().subscribe({
      next: (response) => {
        try {
          const { sources } = response;
          if (Array.isArray(sources)) {
            this.sources.set(sources);
          }
          this.sourcesLoading.set(false);
        } catch (error) {
          this.sourcesError.set(getParserErrorMessage(error, 'Failed to parse sources'));
          this.sourcesLoading.set(false);
        }
      },
      error: (err: unknown) => {
        this.sourcesError.set(getApiErrorMessage(err, 'Failed to load sources'));
        this.sourcesLoading.set(false);
      }
    });
  }

  /**
   * Refresh sessions from API
   */
  refresh(): void {
    this.loadAllSessions();
  }

  /**
   * Start live SSE updates and fallback polling for session updates.
   * This initiates SSE streaming and only falls back to polling when the stream is not connected.
   * @param intervalMs - Polling interval in milliseconds (default: 300000ms / 5 minutes)
   */
  startAutoRefresh(intervalMs = 300000): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.startLiveUpdates();

    // Load sources if not already loaded
    if (this.sources().length === 0 && !this.sourcesLoading()) {
      this.loadSources();
    }

    // Initial fetch if we don't have sessions yet to ensure data is displayed
    if (this.sessions().length === 0 && !this.loading()) {
      this.loadAllSessions();
    }

    if (this.autoRefreshSubscription) {
      return;
    }

    // Start timer with delay to allow stream to connect first
    this.autoRefreshSubscription = timer(intervalMs, intervalMs).subscribe(() => {
      if (!this.streamConnected()) {
        this.loadAllSessions();
      }
    });
  }

  /**
   * Start live SSE updates for session changes.
   * Establishes a Server-Sent Events connection to receive real-time session updates.
   * Updates the streamConnected signal to track connection state.
   */
  startLiveUpdates(): void {
    if (!this.authTokenService.getToken() || this.streamSubscription) {
      return;
    }

    this.streamSubscription = this.streamService
      .sessionsStream({
        pollIntervalSeconds: this.ssePollIntervalSeconds,
        lastUpdate: this.lastSessionUpdateTime
      })
      .subscribe({
        next: event => {
          if (event.type === 'open') {
            this.streamConnected.set(true);
            return;
          }
          if (event.type === 'error') {
            this.streamConnected.set(false);
            return;
          }
          if (event.type === 'sessions_update') {
            this.updateSessions(event.sessions);
          }
        },
        complete: () => {
          this.streamConnected.set(false);
          this.streamSubscription = null;
        }
      });
  }

  /**
   * Stop polling for session updates
   */
  stopAutoRefresh(): void {
    this.autoRefreshSubscription?.unsubscribe();
    this.autoRefreshSubscription = null;
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = null;
    this.streamConnected.set(false);
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
   * Get unique sources from API with fallback to session data
   * Prioritizes loaded sources from API to show all available sources,
   * even if no active sessions exist for them
   */
  readonly uniqueSources = computed(() => {
    const loadedSources = this.sources();
    
    // If sources have been loaded from API, use them (they're already sorted by API)
    if (loadedSources.length > 0) {
      return loadedSources.map(source => ({
        name: source.name,
        display_name: source.display_name
      }));
    }
    
    // Fallback: derive sources from sessions if API sources not yet loaded
    const sourceNames = new Set<string>();
    const map = this.sourceMap();
    
    this.sessions().forEach(session => {
      if (session.source) {
        sourceNames.add(session.source);
      }
    });
    
    return Array.from(sourceNames)
      .sort()
      .map(name => ({
        name,
        display_name: map.get(name) || name
      }));
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
