import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionCreateComponent } from './session-create.component';
import { JulesService } from '../../services/jules.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('SessionCreateComponent', () => {
  let component: SessionCreateComponent;
  let fixture: ComponentFixture<SessionCreateComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let julesService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let router: any;

  beforeEach(async () => {
    julesService = {
      getSources: vi.fn(),
      createSession: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };

    julesService.getSources.mockReturnValue(
      of({
        sources: [
          {
            name: 'sources/test-repo',
            display_name: 'Test Repo',
            github_metadata: { repository: 'owner/repo', branch: 'main' }
          }
        ]
      })
    );

    await TestBed.configureTestingModule({
      imports: [SessionCreateComponent],
      providers: [
        { provide: JulesService, useValue: julesService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionCreateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should submit a session creation request and navigate to the session', () => {
    const sessionResponse = {
      name: 'sessions/abc123',
      display_name: 'Test Session',
      state: 'ACTIVE' as const,
      prompt: 'Test prompt for session',
      source: 'sources/test-repo',
      create_time: '2024-01-01T00:00:00Z',
      update_time: '2024-01-01T00:00:00Z'
    };

    julesService.createSession.mockReturnValue(of(sessionResponse));

    fixture.detectChanges();

    component.form.setValue({
      source: 'sources/test-repo',
      prompt: 'Test prompt for session',
      automationMode: false
    });

    component.onSubmit();

    expect(julesService.createSession).toHaveBeenCalledWith({
      prompt: 'Test prompt for session',
      source: 'sources/test-repo'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/jules', 'abc123']);
  });

  it('should surface errors when session creation fails', () => {
    julesService.createSession.mockReturnValue(throwError(() => ({ error: 'Session failed' })));

    fixture.detectChanges();

    component.form.setValue({
      source: 'sources/test-repo',
      prompt: 'Test prompt for session',
      automationMode: false
    });

    component.onSubmit();

    expect(component.error()).toBe('Session failed');
    expect(component.loading()).toBe(false);
  });
});
