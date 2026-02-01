import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JulesService } from './jules.service';
import { environment } from '../../environments/environment';

describe('JulesService', () => {
  let service: JulesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JulesService],
    });
    service = TestBed.inject(JulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSources', () => {
    it('should fetch sources', () => {
      const mockResponse = {
        sources: [
          {
            name: 'sources/test-repo',
            display_name: 'Test Repo',
            github_metadata: {
              repository: 'owner/repo',
              branch: 'main',
            },
          },
        ],
      };

      service.getSources().subscribe((response) => {
        expect(response.sources.length).toBe(1);
        expect(response.sources[0].display_name).toBe('Test Repo');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sources/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createSession', () => {
    it('should create a session', () => {
      const mockSession = {
        name: 'sessions/test-session',
        display_name: 'Test Session',
        state: 'ACTIVE' as const,
        prompt: 'Test prompt',
        source: 'sources/test-repo',
        create_time: '2024-01-01T00:00:00Z',
        update_time: '2024-01-01T00:00:00Z',
      };

      service
        .createSession({ prompt: 'Test prompt', source: 'sources/test-repo' })
        .subscribe((session) => {
          expect(session.display_name).toBe('Test Session');
          expect(session.state).toBe('ACTIVE');
        });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ prompt: 'Test prompt', source: 'sources/test-repo' });
      req.flush(mockSession);
    });

    it('should propagate errors when session creation fails', async () => {
      const errorPromise = new Promise<{ status: number; error: unknown }>((_, reject) => {
        service.createSession({ prompt: 'Test prompt', source: 'sources/test-repo' }).subscribe({
          next: () => reject(new Error('Expected error')),
          error: (err) => reject(err),
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/`);
      expect(req.request.method).toBe('POST');
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

      await expect(errorPromise).rejects.toMatchObject({
        status: 500,
        error: { error: 'Server error' },
      });
    });
  });

  describe('getSessions', () => {
    it('should fetch sessions with pagination', () => {
      const mockResponse = {
        sessions: [
          {
            name: 'sessions/test-session',
            display_name: 'Test Session',
            state: 'ACTIVE' as const,
            prompt: 'Test prompt',
            source: 'sources/test-repo',
            create_time: '2024-01-01T00:00:00Z',
            update_time: '2024-01-01T00:00:00Z',
          },
        ],
        next_page_token: null,
      };

      service.getSessions().subscribe((response) => {
        expect(response.sessions.length).toBe(1);
        expect(response.sessions[0].display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/?page_size=100`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSession', () => {
    it('should fetch a single session', () => {
      const mockSession = {
        name: 'sessions/test-session',
        display_name: 'Test Session',
        state: 'ACTIVE' as const,
        prompt: 'Test prompt',
        source: 'sources/test-repo',
        create_time: '2024-01-01T00:00:00Z',
        update_time: '2024-01-01T00:00:00Z',
      };

      service.getSession('test-session').subscribe((session) => {
        expect(session.display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/test-session/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSession);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      service.deleteSession('test-session').subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/test-session/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('approvePlan', () => {
    it('should approve a plan', () => {
      const mockSession = {
        name: 'sessions/test-session',
        display_name: 'Test Session',
        state: 'ACTIVE' as const,
        prompt: 'Test prompt',
        source: 'sources/test-repo',
        create_time: '2024-01-01T00:00:00Z',
        update_time: '2024-01-01T00:00:00Z',
      };

      service.approvePlan('test-session').subscribe((session) => {
        expect(session.display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/jules/sessions/test-session/approve-plan/`,
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockSession);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', () => {
      const mockSession = {
        name: 'sessions/test-session',
        display_name: 'Test Session',
        state: 'ACTIVE' as const,
        prompt: 'Test prompt',
        source: 'sources/test-repo',
        create_time: '2024-01-01T00:00:00Z',
        update_time: '2024-01-01T00:00:00Z',
      };

      service.sendMessage('test-session', { message: 'Test message' }).subscribe((session) => {
        expect(session.display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/jules/sessions/test-session/send-message/`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: 'Test message' });
      req.flush(mockSession);
    });
  });

  describe('getActivities', () => {
    it('should fetch activities', () => {
      const mockResponse = {
        activities: [
          {
            name: 'activities/test-activity',
            plan_generated: {
              plan: {
                steps: [],
                state: 'PENDING' as const,
              },
            },
            create_time: '2024-01-01T00:00:00Z',
          },
        ],
        next_page_token: null,
      };

      service.getActivities('test-session').subscribe((response) => {
        expect(response.activities.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/jules/sessions/test-session/activities/?page_size=100`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSettings', () => {
    it('should fetch settings', () => {
      const mockResponse = {
        api_key_configured: true,
        masked_api_key: '****1234',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      service.getSettings().subscribe((response) => {
        expect(response.api_key_configured).toBe(true);
        expect(response.masked_api_key).toBe('****1234');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/settings/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateApiKey', () => {
    it('should update the API key', () => {
      const mockResponse = {
        status: 'success',
        message: 'API key saved',
      };

      service.updateApiKey('test-key').subscribe((response) => {
        expect(response.message).toBe('API key saved');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/settings/api-key/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ api_key: 'test-key' });
      req.flush(mockResponse);
    });

    it('should surface masked API key responses', () => {
      const mockResponse = {
        status: 'success',
        message: 'API key saved',
        masked_api_key: '****9999',
      };

      service.updateApiKey('test-key').subscribe((response) => {
        expect(response.masked_api_key).toBe('****9999');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/settings/api-key/`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('testConnection', () => {
    it('should test the connection', () => {
      const mockResponse = {
        status: 'success',
        message: 'Connection ok',
        api_key_configured: true,
        api_connectivity: 'ok',
        sources_count: 3,
      };

      service.testConnection().subscribe((response) => {
        expect(response.status).toBe('success');
        expect(response.sources_count).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/settings/test/`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
