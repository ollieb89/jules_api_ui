import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { JulesStreamService } from './jules-stream.service';
import { AuthTokenService } from './auth-token.service';
import { JulesService } from './jules.service';
import { vi } from 'vitest';

describe('JulesStreamService', () => {
  let service: JulesStreamService;
  let mockAuthTokenService: { getToken: ReturnType<typeof vi.fn> };
  let mockJulesService: {
    getSessionsEventStreamUrl: ReturnType<typeof vi.fn>;
    getSessionEventStreamUrl: ReturnType<typeof vi.fn>;
  };
  let mockEventSource: any;
  let OriginalEventSource: any;

  beforeEach(() => {
    // Mock AuthTokenService
    mockAuthTokenService = {
      getToken: vi.fn()
    };

    // Mock JulesService
    mockJulesService = {
      getSessionsEventStreamUrl: vi.fn(),
      getSessionEventStreamUrl: vi.fn()
    };

    // Mock EventSource
    mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    };

    // Store original EventSource and replace with mock
    OriginalEventSource = (globalThis as any).EventSource;
    (globalThis as any).EventSource = vi.fn(function () {
      return mockEventSource;
    });

    TestBed.configureTestingModule({
      providers: [
        JulesStreamService,
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: JulesService, useValue: mockJulesService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(JulesStreamService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original EventSource
    if (OriginalEventSource) {
      (globalThis as any).EventSource = OriginalEventSource;
    }
  });

  describe('sessionsStream', () => {
    it('should return EMPTY when not in browser platform', () =>
      new Promise<void>((resolve, reject) => {
        // Create a new service instance with server platform
        const serverService = new JulesStreamService();
        const servicePrivate = serverService as any;
        servicePrivate.platformId = 'server';
        servicePrivate.authTokenService = mockAuthTokenService;
        servicePrivate.julesService = mockJulesService;

        const observable = serverService.sessionsStream();

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve()
        });
      }));

    it('should return EMPTY when no token is available', () =>
      new Promise<void>((resolve, reject) => {
        mockAuthTokenService.getToken.mockReturnValue(null);

        const observable = service.sessionsStream();

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve()
        });
      }));

    it('should create EventSource with correct URL and parameters', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

      const observable = service.sessionsStream({
        pollIntervalSeconds: 15,
        lastUpdate: '2024-01-01T00:00:00Z'
      });

      const subscription = observable.subscribe();

      expect(mockJulesService.getSessionsEventStreamUrl).toHaveBeenCalledWith(
        expect.any(URLSearchParams)
      );

      const params = mockJulesService.getSessionsEventStreamUrl.mock.calls[0][0];
      expect(params.get('token')).toBe('test-token');
      expect(params.get('poll_interval')).toBe('15');
      expect(params.get('last_update')).toBe('2024-01-01T00:00:00Z');

      subscription.unsubscribe();
    });

    it('should emit open event when EventSource opens', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'open') {
              resolve();
            }
          }
        });

        // Simulate EventSource open event
        const openHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'open'
        )[1];
        openHandler();
      }));

    it('should emit sessions_update event with parsed data', () =>
      new Promise<void>((resolve) => {
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
            update_time: '2024-01-01T00:00:00Z'
          }
        ];

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'sessions_update') {
              expect(event.sessions).toEqual(mockSessions);
              resolve();
            }
          }
        });

        // Simulate EventSource sessions_update event
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'sessions_update'
        )[1];
        updateHandler({ data: JSON.stringify(mockSessions) });
      }));

    it('should handle JSON parse errors gracefully', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'error') {
              resolve();
            }
          }
        });

        // Simulate EventSource sessions_update event with invalid JSON
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'sessions_update'
        )[1];
        updateHandler({ data: 'invalid json' });
      }));

    it('should emit error event and close on EventSource error', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

        const observable = service.sessionsStream();

        observable.subscribe({
          next: (event) => {
            if (event.type === 'error') {
              expect(mockEventSource.close).toHaveBeenCalled();
            }
          },
          complete: () => resolve()
        });

        // Simulate EventSource error event
        const errorHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'error'
        )[1];
        errorHandler();
      }));

    it('should remove event listeners and close EventSource on unsubscribe', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionsEventStreamUrl.mockReturnValue('https://example.com/stream');

      const observable = service.sessionsStream();
      const subscription = observable.subscribe();

      subscription.unsubscribe();

      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'sessions_update',
        expect.any(Function)
      );
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe('sessionStream', () => {
    it('should return EMPTY when not in browser platform', () =>
      new Promise<void>((resolve, reject) => {
        // Create a new service instance with server platform
        const serverService = new JulesStreamService();
        const servicePrivate = serverService as any;
        servicePrivate.platformId = 'server';
        servicePrivate.authTokenService = mockAuthTokenService;
        servicePrivate.julesService = mockJulesService;

        const observable = serverService.sessionStream('test-session-id');

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve()
        });
      }));

    it('should return EMPTY when no token is available', () =>
      new Promise<void>((resolve, reject) => {
        mockAuthTokenService.getToken.mockReturnValue(null);

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: () => reject(new Error('Should not emit')),
          complete: () => resolve()
        });
      }));

    it('should create EventSource with correct URL and parameters', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionEventStreamUrl.mockReturnValue(
        'https://example.com/session-stream'
      );

      const observable = service.sessionStream('test-session-id', { pollIntervalSeconds: 10 });

      const subscription = observable.subscribe();

      expect(mockJulesService.getSessionEventStreamUrl).toHaveBeenCalledWith(
        'test-session-id',
        expect.any(URLSearchParams)
      );

      const params = mockJulesService.getSessionEventStreamUrl.mock.calls[0][1];
      expect(params.get('token')).toBe('test-token');
      expect(params.get('poll_interval')).toBe('10');

      subscription.unsubscribe();
    });

    it('should emit session_update event with parsed data', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream'
        );

        const mockSession = {
          name: 'sessions/test-1',
          display_name: 'Test Session',
          state: 'ACTIVE' as const,
          prompt: 'Test prompt',
          source: 'sources/test-repo',
          create_time: '2024-01-01T00:00:00Z',
          update_time: '2024-01-01T00:00:00Z'
        };

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'session_update') {
              expect(event.session).toEqual(mockSession);
              resolve();
            }
          }
        });

        // Simulate EventSource session_update event
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'session_update'
        )[1];
        updateHandler({ data: JSON.stringify(mockSession) });
      }));

    it('should emit activity_update event', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream'
        );

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'activity_update') {
              resolve();
            }
          }
        });

        // Simulate EventSource activity_update event
        const activityHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'activity_update'
        )[1];
        activityHandler();
      }));

    it('should handle JSON parse errors gracefully', () =>
      new Promise<void>((resolve) => {
        mockAuthTokenService.getToken.mockReturnValue('test-token');
        mockJulesService.getSessionEventStreamUrl.mockReturnValue(
          'https://example.com/session-stream'
        );

        const observable = service.sessionStream('test-session-id');

        observable.subscribe({
          next: (event) => {
            if (event.type === 'error') {
              resolve();
            }
          }
        });

        // Simulate EventSource session_update event with invalid JSON
        const updateHandler = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'session_update'
        )[1];
        updateHandler({ data: 'invalid json' });
      }));

    it('should remove event listeners and close EventSource on unsubscribe', () => {
      mockAuthTokenService.getToken.mockReturnValue('test-token');
      mockJulesService.getSessionEventStreamUrl.mockReturnValue(
        'https://example.com/session-stream'
      );

      const observable = service.sessionStream('test-session-id');
      const subscription = observable.subscribe();

      subscription.unsubscribe();

      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'session_update',
        expect.any(Function)
      );
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith(
        'activity_update',
        expect.any(Function)
      );
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
});
