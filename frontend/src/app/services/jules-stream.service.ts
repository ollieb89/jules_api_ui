import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY, Observer } from 'rxjs';
import { AuthTokenService } from './auth-token.service';
import { JulesService } from './jules.service';
import { Session } from '../models/jules.model';
import { parseSessionResponse, parseSessionsList } from '../utils/api-parsers';

export type SessionsStreamEvent =
  | { type: 'open' }
  | { type: 'error' }
  | { type: 'sessions_update'; sessions: Session[] };

export type SessionStreamEvent =
  | { type: 'open' }
  | { type: 'error' }
  | { type: 'session_update'; session: Session }
  | { type: 'activity_update'; latestActivityId?: number | null };

type StreamEventHandler<T> = {
  eventType: string;
  handler: (event: Event, observer: Observer<T>) => void;
};

@Injectable({ providedIn: 'root' })
export class JulesStreamService {
  private readonly authTokenService = inject(AuthTokenService);
  private readonly julesService = inject(JulesService);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Create an SSE Observable with common event handling logic
   * @param streamUrl - The SSE endpoint URL
   * @param eventHandlers - Array of event type and handler pairs
   * @returns Observable that emits stream events
   */
  private createEventSourceObservable<T>(
    streamUrl: string,
    eventHandlers: StreamEventHandler<T>[]
  ): Observable<T> {
    return new Observable<T>(observer => {
      // Reconnect with capped exponential backoff to avoid rapid reconnect loops.
      const maxReconnectAttempts = 5;
      const baseReconnectDelayMs = 1000;
      const maxReconnectDelayMs = 30000;
      let reconnectAttempts = 0;
      let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
      let eventSource: EventSource | null = null;
      let listeners: Array<{ type: string; handler: EventListener }> = [];
      let closed = false;

      const clearReconnectTimer = () => {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      const cleanupEventSource = () => {
        if (!eventSource) {
          return;
        }
        listeners.forEach(({ type, handler }) => {
          eventSource?.removeEventListener(type, handler);
        });
        eventSource.close();
        eventSource = null;
        listeners = [];
      };

      const scheduleReconnect = () => {
        if (closed) {
          return;
        }
        if (reconnectAttempts >= maxReconnectAttempts) {
          observer.complete();
          return;
        }
        const delay = Math.min(maxReconnectDelayMs, baseReconnectDelayMs * 2 ** reconnectAttempts);
        reconnectAttempts += 1;
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      };

      const connect = () => {
        if (closed) {
          return;
        }
        clearReconnectTimer();
        cleanupEventSource();
        eventSource = new EventSource(streamUrl);

        const handleOpen = () => {
          reconnectAttempts = 0;
          observer.next({ type: 'open' } as T);
        };

        const handleError = () => {
          observer.next({ type: 'error' } as T);
          cleanupEventSource();
          scheduleReconnect();
        };

        // Register open and error handlers
        eventSource.addEventListener('open', handleOpen);
        eventSource.addEventListener('error', handleError);
        listeners.push({ type: 'open', handler: handleOpen });
        listeners.push({ type: 'error', handler: handleError });

        // Register custom event handlers
        eventHandlers.forEach(({ eventType, handler }) => {
          const wrappedHandler = (event: Event) => {
            try {
              handler(event, observer);
            } catch (error) {
              console.error(
                `Failed to handle ${eventType} event:`,
                error,
                'Event data:',
                (event as MessageEvent).data
              );
              observer.next({ type: 'error' } as T);
            }
          };
          if (eventSource) {
            eventSource.addEventListener(eventType, wrappedHandler);
            listeners.push({ type: eventType, handler: wrappedHandler });
          }
        });
      };

      connect();

      return () => {
        closed = true;
        clearReconnectTimer();
        cleanupEventSource();
      };
    });
  }

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

    return this.createEventSourceObservable<SessionsStreamEvent>(streamUrl, [
      {
        eventType: 'sessions_update',
        handler: (event: Event, observer) => {
          const data = JSON.parse((event as MessageEvent).data) as unknown;
          const sessions = parseSessionsList(data);
          observer.next({ type: 'sessions_update', sessions });
        }
      }
    ]);
  }

  sessionStream(
    sessionId: string,
    {
      pollIntervalSeconds = 5,
      lastUpdate,
      lastActivityId
    }: { pollIntervalSeconds?: number; lastUpdate?: string | null; lastActivityId?: number | null } = {}
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

    if (lastUpdate) {
      params.set('last_update', lastUpdate);
    }

    if (lastActivityId) {
      params.set('last_activity_id', lastActivityId.toString());
    }

    const streamUrl = this.julesService.getSessionEventStreamUrl(sessionId, params);

    return this.createEventSourceObservable<SessionStreamEvent>(streamUrl, [
      {
        eventType: 'session_update',
        handler: (event: Event, observer) => {
          const data = JSON.parse((event as MessageEvent).data) as unknown;
          const session = parseSessionResponse(data);
          observer.next({ type: 'session_update', session });
        }
      },
      {
        eventType: 'activity_update',
        handler: (event: Event, observer) => {
          let latestActivityId: number | null | undefined;
          try {
            const data = JSON.parse((event as MessageEvent).data) as { latest_activity_id?: number };
            latestActivityId = data.latest_activity_id ?? null;
          } catch (error) {
            latestActivityId = null;
          }
          observer.next({ type: 'activity_update', latestActivityId });
        }
      }
    ]);
  }
}
