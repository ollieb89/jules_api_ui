import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY } from 'rxjs';
import { AuthTokenService } from './auth-token.service';
import { JulesService } from './jules.service';
import { Session } from '../models/jules.model';

export type SessionsStreamEvent =
  | { type: 'open' }
  | { type: 'error' }
  | { type: 'sessions_update'; sessions: Session[] };

export type SessionStreamEvent =
  | { type: 'open' }
  | { type: 'error' }
  | { type: 'session_update'; session: Session }
  | { type: 'activity_update' };

@Injectable({ providedIn: 'root' })
export class JulesStreamService {
  private readonly authTokenService = inject(AuthTokenService);
  private readonly julesService = inject(JulesService);
  private readonly platformId = inject(PLATFORM_ID);

  sessionsStream({
    pollIntervalSeconds = 10,
    lastUpdate
  }: {
    pollIntervalSeconds?: number;
    lastUpdate?: string | null;
  } = {}): Observable<SessionsStreamEvent> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const token = this.authTokenService.getToken();
    if (!token) {
      return EMPTY;
    }

    const params = new URLSearchParams({
      token,
      poll_interval: pollIntervalSeconds.toString()
    });

    if (lastUpdate) {
      params.set('last_update', lastUpdate);
    }

    const streamUrl = this.julesService.getSessionsEventStreamUrl(params);

    return new Observable<SessionsStreamEvent>(observer => {
      const eventSource = new EventSource(streamUrl);

      const handleOpen = () => {
        observer.next({ type: 'open' });
      };

      const handleSessionsUpdate = (event: Event) => {
        const data = JSON.parse((event as MessageEvent).data) as Session[];
        observer.next({ type: 'sessions_update', sessions: data });
      };

      const handleError = () => {
        observer.next({ type: 'error' });
        observer.complete();
        eventSource.close();
      };

      eventSource.addEventListener('open', handleOpen);
      eventSource.addEventListener('sessions_update', handleSessionsUpdate);
      eventSource.addEventListener('error', handleError);

      return () => {
        eventSource.close();
      };
    });
  }

  sessionStream(
    sessionId: string,
    { pollIntervalSeconds = 5 }: { pollIntervalSeconds?: number } = {}
  ): Observable<SessionStreamEvent> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const token = this.authTokenService.getToken();
    if (!token) {
      return EMPTY;
    }

    const params = new URLSearchParams({
      token,
      poll_interval: pollIntervalSeconds.toString()
    });

    const streamUrl = this.julesService.getSessionEventStreamUrl(sessionId, params);

    return new Observable<SessionStreamEvent>(observer => {
      const eventSource = new EventSource(streamUrl);

      const handleOpen = () => {
        observer.next({ type: 'open' });
      };

      const handleSessionUpdate = (event: Event) => {
        const data = JSON.parse((event as MessageEvent).data) as Session;
        observer.next({ type: 'session_update', session: data });
      };

      const handleActivityUpdate = () => {
        observer.next({ type: 'activity_update' });
      };

      const handleError = () => {
        observer.next({ type: 'error' });
        observer.complete();
        eventSource.close();
      };

      eventSource.addEventListener('open', handleOpen);
      eventSource.addEventListener('session_update', handleSessionUpdate);
      eventSource.addEventListener('activity_update', handleActivityUpdate);
      eventSource.addEventListener('error', handleError);

      return () => {
        eventSource.close();
      };
    });
  }
}
