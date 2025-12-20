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
      providers: [JulesService]
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
              branch: 'main'
            }
          }
        ]
      };

      service.getSources().subscribe(response => {
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
        update_time: '2024-01-01T00:00:00Z'
      };

      service.createSession({ prompt: 'Test prompt', source: 'sources/test-repo' }).subscribe(session => {
        expect(session.display_name).toBe('Test Session');
        expect(session.state).toBe('ACTIVE');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ prompt: 'Test prompt', source: 'sources/test-repo' });
      req.flush(mockSession);
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
            update_time: '2024-01-01T00:00:00Z'
          }
        ],
        next_page_token: null
      };

      service.getSessions().subscribe(response => {
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
        update_time: '2024-01-01T00:00:00Z'
      };

      service.getSession('test-session').subscribe(session => {
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
        update_time: '2024-01-01T00:00:00Z'
      };

      service.approvePlan('test-session').subscribe(session => {
        expect(session.display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/test-session/approve-plan/`);
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
        update_time: '2024-01-01T00:00:00Z'
      };

      service.sendMessage('test-session', { message: 'Test message' }).subscribe(session => {
        expect(session.display_name).toBe('Test Session');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/test-session/send-message/`);
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
                state: 'PENDING' as const
              }
            },
            create_time: '2024-01-01T00:00:00Z'
          }
        ],
        next_page_token: null
      };

      service.getActivities('test-session').subscribe(response => {
        expect(response.activities.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/jules/sessions/test-session/activities/?page_size=100`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});

