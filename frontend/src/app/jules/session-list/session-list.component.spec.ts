// @vitest-environment jsdom
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SessionListComponent } from './session-list.component';
import { SessionCacheService } from '../../services/session-cache.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { SessionUtilsService } from '../../services/session-utils.service';
import { provideRouter } from '@angular/router';

describe('SessionListComponent', () => {
  const mockSessions = [
    { name: 'sessions/1', display_name: 'Session 1', state: 'ACTIVE', prompt: 'Prompt 1', source: 'Source 1', create_time: '2024-01-01', update_time: '2024-01-02' }
  ];

  const cacheService = {
    loading: vi.fn(() => false),
    error: vi.fn(() => null),
    totalCount: vi.fn(() => 1),
    filteredCount: vi.fn(() => 1),
    filteredSessions: vi.fn(() => mockSessions),
    lastUpdated: vi.fn(() => new Date()),
    startAutoRefresh: vi.fn(),
    filter: vi.fn(() => ({})),
    sortField: vi.fn(() => 'created_at'),
    sortDirection: vi.fn(() => 'desc'),
    sessions: vi.fn(() => mockSessions),
    uniqueSources: vi.fn(() => [])
  };

  const themeService = {
    getTheme: vi.fn(() => 'light'),
    toggle: vi.fn()
  };

  const notificationService = {
    show: vi.fn()
  };

  const confirmDialogService = {
    confirm: vi.fn()
  };

  const sessionUtils = {
    extractSessionId: vi.fn((name) => name.split('/').pop() || name)
  };

  beforeEach(async () => {
    // Mock matchMedia for window
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [SessionListComponent],
      providers: [
        { provide: SessionCacheService, useValue: cacheService },
        { provide: ThemeService, useValue: themeService },
        { provide: NotificationService, useValue: notificationService },
        { provide: ConfirmDialogService, useValue: confirmDialogService },
        { provide: SessionUtilsService, useValue: sessionUtils },
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('renders session list items', () => {
    const fixture = TestBed.createComponent(SessionListComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Session 1');
    expect(compiled.textContent).toContain('Active');
  });

  it('renders View and Message actions as links', () => {
    const fixture = TestBed.createComponent(SessionListComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Query for anchors
    const links = compiled.querySelectorAll('a');
    const linkTexts = Array.from(links).map(a => a.textContent?.trim());

    expect(linkTexts).toContain('View');
    expect(linkTexts).toContain('Message');
  });
});
