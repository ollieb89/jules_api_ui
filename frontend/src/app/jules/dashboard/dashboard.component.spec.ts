import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { SessionCacheService } from '../../services/session-cache.service';
import { ThemeService } from '../../services/theme.service';
import { provideRouter } from '@angular/router';

describe('DashboardComponent', () => {
  it('renders summary counts and starts auto refresh', async () => {
    const cacheService = {
      totalCount: vi.fn(() => 12),
      activeCount: vi.fn(() => 3),
      completedCount: vi.fn(() => 8),
      failedCount: vi.fn(() => 1),
      lastUpdated: vi.fn(() => new Date('2024-01-01T10:00:00Z')),
      sessions: vi.fn(() => []),
      startAutoRefresh: vi.fn(),
    };

    const themeService = {
      toggle: vi.fn(),
      getTheme: vi.fn(() => 'light'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SessionCacheService, useValue: cacheService },
        { provide: ThemeService, useValue: themeService },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(cacheService.startAutoRefresh).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Active Tasks');
    expect(compiled.textContent).toContain('3');
  });

  it('renders recent sessions and navigates on click', async () => {
    const mockSessions = [
      {
        name: 'sessions/1',
        display_name: 'Session 1',
        state: 'ACTIVE',
        prompt: 'Prompt 1',
        source: 'Source 1',
        update_time: '2024-01-02T10:00:00Z',
      },
      {
        name: 'sessions/2',
        display_name: 'Session 2',
        state: 'COMPLETED',
        prompt: 'Prompt 2',
        source: 'Source 2',
        update_time: '2024-01-01T10:00:00Z',
      },
    ];

    const cacheService = {
      totalCount: vi.fn(() => 0),
      activeCount: vi.fn(() => 0),
      completedCount: vi.fn(() => 0),
      failedCount: vi.fn(() => 0),
      lastUpdated: vi.fn(() => new Date()),
      sessions: vi.fn(() => mockSessions),
      startAutoRefresh: vi.fn(),
    };

    const themeService = {
      toggle: vi.fn(),
      getTheme: vi.fn(() => 'light'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SessionCacheService, useValue: cacheService },
        { provide: ThemeService, useValue: themeService },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    // Router navigation is handled by routerLink, so we check the href or routerLink binding
    // But testing RouterLink directives usually involves clicking or checking attributes.
    // Since we provided provideRouter([]), the RouterLink directive should function.

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Check if Recent Sessions header is present
    expect(compiled.textContent).toContain('Recent Sessions');

    // Check if sessions are rendered
    expect(compiled.textContent).toContain('Session 1');
    expect(compiled.textContent).toContain('Session 2');

    // Look for the anchor tag for Session 1
    const sessionLink = Array.from(compiled.querySelectorAll('a')).find((el) =>
      el.textContent?.includes('Session 1'),
    );

    if (sessionLink) {
      expect(sessionLink.getAttribute('href')).toBe('/jules/1');

      // Also verify accessible status
      const srText = sessionLink.querySelector('.sr-only');
      expect(srText?.textContent).toContain('Active');
    } else {
      throw new Error('Session link not found');
    }
  });
});
