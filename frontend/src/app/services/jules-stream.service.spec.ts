import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { JulesStreamService } from './jules-stream.service';
import { AuthTokenService } from './auth-token.service';
import { JulesService } from './jules.service';
import { vi, Mock } from 'vitest';

interface MockEventSource {
  addEventListener: Mock;
  removeEventListener: Mock;
  close: Mock;
}

describe('JulesStreamService', () => {
  let service: JulesStreamService;
  let mockAuthTokenService: { getToken: Mock };
  let mockJulesService: {
    getSessionsEventStreamUrl: Mock;
    getSessionEventStreamUrl: Mock;
  };
  let mockEventSource: MockEventSource;
  let createdSources: MockEventSource[];
  let OriginalEventSource: unknown;

  beforeEach(() => {
    // Mock AuthTokenService
    mockAuthTokenService = {
      getToken: vi.fn(),
    };

    // Mock JulesService
    mockJulesService = {
      getSessionsEventStreamUrl: vi.fn(),
      getSessionEventStreamUrl: vi.fn(),
    };

    createdSources = [];

    // Store original EventSource and replace with mock
    class MockEventSourceImpl implements MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      constructor() {
        createdSources.push(this);
      }
    }
    OriginalEventSource = (globalThis as Record<string, unknown>)['EventSource'];
    (globalThis as Record<string, unknown>)['EventSource'] = MockEventSourceImpl;

    TestBed.configureTestingModule({
      providers: [
        JulesStreamService,
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: JulesService, useValue: mockJulesService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(JulesStreamService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original EventSource
    if (OriginalEventSource) {
      (globalThis as Record<string, unknown>)['EventSource'] = OriginalEventSource;
    }
  });

  describe('sessionsStream', () => {
    it('should return EMPTY when not in browser platform', () => {
      return new Promise<void>((resolve, reject) => {
        // Create a new service instance with server platform
        const serverService = TestBed.runInInjectionContext(() => new JulesStreamService());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const servicePrivate = serverService as any;
        servicePrivate.platformId = 'server';
        servicePrivate.authTokenService = mockAuthTokenService;
        servicePrivate.julesService = mockJulesService;

        const observable = serverService.sessionsStream();

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve(),
        });
      });
    });

    it('should return EMPTY when no token is available', () => {
      return new Promise<void>((resolve, reject) => {
        mockAuthTokenService.getToken.mockReturnValue(null);

        const observable = service.sessionsStream();

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve(),
        });
      });
    });

    it('should create EventSource with correct URL and parameters', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

      const observable = service.sessionsStream({
        pollIntervalSeconds: 15,
        lastUpdate: '2024-01-01T00:00:00Z',
      });

      const subscription = observable.subscribe();
      mockEventSource = createdSources[0];

      expect(mockJulesService.getSessionsEventStreamUrl).toHaveBeenCalledWith(
        expect.any(URLSearchParams),
      );

      const params = mockJulesService.getSessionsEventStreamUrl.mock.calls[0][0];
      expect(params.get('token')).toBe('test-token');
      expect(params.get('poll_interval')).toBe('15');
      expect(params.get('last_update')).toBe('2024-01-01T00:00:00Z');

      subscription.unsubscribe();
    });

    it('should emit open event when EventSource opens', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'open') {
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource open event
        const openHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'open',
        )![1] as () => void;
        openHandler();
      });
    });

    it('should emit sessions_update event with parsed data', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const mockSessions = [
          {
            name: 'sessions/test-1',
            display_name: 'Test Session 1',
            state: 'ACTIVE' as const,
            prompt: 'Test prompt',
            source: 'sources/test-repo',
            create_time: '2024-01-01T00:00:00Z',
            update_time: '2024-01-01T00:00:00Z',
          },
        ];

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'sessions_update') {
              expect(event.sessions).toEqual(mockSessions);
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource sessions_update event
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'sessions_update',
        )![1] as (event: { data: string }) => void;
        updateHandler({ data: JSON.stringify(mockSessions) });
      });
    });

    it('should handle JSON parse errors gracefully', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'error') {
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource sessions_update event with invalid JSON
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'sessions_update',
        )![1] as (event: { data: string }) => void;
        updateHandler({ data: 'invalid json' });
      });
    });

    it('should emit error event, close, and attempt reconnect on EventSource error', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

      vi.useFakeTimers();
      const observable = service.sessionsStream();

      observable.subscribe();
      mockEventSource = createdSources[0];

      // Simulate EventSource error event
      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'error',
      )![1] as () => void;
      errorHandler();

      expect(mockEventSource.close).toHaveBeenCalled();
      vi.runAllTimers();
      expect(createdSources.length).toBeGreaterThan(1);
      vi.useRealTimers();
    });

    it('should remove event listeners and close EventSource on unsubscribe', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

      const observable = service.sessionsStream();
      const subscription = observable.subscribe();
      mockEventSource = createdSources[0];

      subscription.unsubscribe();

      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'open',
        expect.any(Function),
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'sessions_update',
        expect.any(Function),
      );
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe('sessionStream', () => {
    it('should return EMPTY when not in browser platform', () => {
      return new Promise<void>((resolve, reject) => {
        // Create a new service instance with server platform
        const serverService = TestBed.runInInjectionContext(() => new JulesStreamService());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const servicePrivate = serverService as any;
        servicePrivate.platformId = 'server';
        servicePrivate.authTokenService = mockAuthTokenService;
        servicePrivate.julesService = mockJulesService;

        const observable = serverService.sessionStream('test-session-id');

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve(),
        });
      });
    });

    it('should return EMPTY when no token is available', () => {
      return new Promise<void>((resolve, reject) => {
        mockAuthTokenService.getToken.mockReturnValue(null);

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve(),
        });
      });
    });

    it('should create EventSource with correct URL and parameters', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionEventStreamUrl.mockReturnValue(
        'https://example.com/session-stream',
      );

      const observable = service.sessionStream('test-session-id', {
        pollIntervalSeconds: 10,
        lastUpdate: '2024-01-02T00:00:00Z',
        lastActivityId: 42,
      });

      const subscription = observable.subscribe();

      expect(mockJulesService.getSessionEventStreamUrl).toHaveBeenCalledWith(
        'test-session-id',
        expect.any(URLSearchParams),
      );

      const params = mockJulesService.getSessionEventStreamUrl.mock.calls[0][1];
      expect(params.get('token')).toBe('test-token');
      expect(params.get('poll_interval')).toBe('10');
      expect(params.get('last_update')).toBe('2024-01-02T00:00:00Z');
      expect(params.get('last_activity_id')).toBe('42');

      subscription.unsubscribe();
    });

    it('should emit session_update event with parsed data', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream',
        );

        const mockSession = {
          name: 'sessions/test-1',
          display_name: 'Test Session',
          state: 'ACTIVE' as const,
          prompt: 'Test prompt',
          source: 'sources/test-repo',
          create_time: '2024-01-01T00:00:00Z',
          update_time: '2024-01-01T00:00:00Z',
        };

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'session_update') {
              expect(event.session).toEqual(mockSession);
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource session_update event
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'session_update',
        )![1] as (event: { data: string }) => void;
        updateHandler({ data: JSON.stringify(mockSession) });
      });
    });

    it('should emit activity_update event', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream',
        );

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'activity_update') {
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource activity_update event
        const activityHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'activity_update',
        )![1] as (event: { data: string }) => void;
        activityHandler({ data: JSON.stringify({ latest_activity_id: 7 }) });
      });
    });

    it('should handle JSON parse errors gracefully', () => {
      return new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream',
        );

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'error') {
              resolve();
            }
          },
        });
        mockEventSource = createdSources[0];

        // Simulate EventSource session_update event with invalid JSON
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: unknown[]) => call[0] === 'session_update',
        )![1] as (event: { data: string }) => void;
        updateHandler({ data: 'invalid json' });
      });
    });

    it('should remove event listeners and close EventSource on unsubscribe', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionEventStreamUrl.mockReturnValue(
        'https://example.com/session-stream',
      );

      const observable = service.sessionStream('test-session-id');
      const subscription = observable.subscribe();
      mockEventSource = createdSources[0];

      subscription.unsubscribe();

      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'open',
        expect.any(Function),
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'session_update',
        expect.any(Function),
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'activity_update',
        expect.any(Function),
      );
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
});
