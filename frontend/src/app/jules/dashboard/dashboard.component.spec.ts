import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { SessionCacheService } from '../../services/session-cache.service';
import { ThemeService } from '../../services/theme.service';
import { provideRouter, Router } from '@angular/router';

describe('DashboardComponent', () => {
  it('renders summary counts and starts auto refresh', async () => {
    const cacheService = {
      totalCount: vi.fn(() => 12),
      activeCount: vi.fn(() => 3),
      completedCount: vi.fn(() => 8),
      failedCount: vi.fn(() => 1),
      lastUpdated: vi.fn(() => new Date('2024-01-01T10:00:00Z')),
      sessions: vi.fn(() => []),
      startAutoRefresh: vi.fn()
    };

    const themeService = {
      toggle: vi.fn(),
      getTheme: vi.fn(() => 'light')
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SessionCacheService, useValue: cacheService },
        { provide: ThemeService, useValue: themeService },
        provideRouter([])
      ]
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
      { name: 'sessions/1', display_name: 'Session 1', state: 'ACTIVE', prompt: 'Prompt 1', source: 'Source 1', update_time: '2024-01-02T10:00:00Z' },
      { name: 'sessions/2', display_name: 'Session 2', state: 'COMPLETED', prompt: 'Prompt 2', source: 'Source 2', update_time: '2024-01-01T10:00:00Z' }
    ];

    const cacheService = {
      totalCount: vi.fn(() => 0),
      activeCount: vi.fn(() => 0),
      completedCount: vi.fn(() => 0),
      failedCount: vi.fn(() => 0),
      lastUpdated: vi.fn(() => new Date()),
      sessions: vi.fn(() => mockSessions),
      startAutoRefresh: vi.fn()
    };

    const themeService = {
      toggle: vi.fn(),
      getTheme: vi.fn(() => 'light')
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SessionCacheService, useValue: cacheService },
        { provide: ThemeService, useValue: themeService },
        provideRouter([])
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Check if Recent Sessions header is present
    expect(compiled.textContent).toContain('Recent Sessions');

    // Check if sessions are rendered
    expect(compiled.textContent).toContain('Session 1');
    expect(compiled.textContent).toContain('Session 2');

    // Simulate click on the first session card
    // The clickable element has class 'cursor-pointer' or strictly we can find by text
    const sessionCard = Array.from(compiled.querySelectorAll('div')).find(
      el => el.textContent?.includes('Session 1') && el.getAttribute('role') === 'button'
    );

    if (sessionCard) {
      (sessionCard as HTMLElement).click();
      expect(navigateSpy).toHaveBeenCalledWith(['/jules', '1']);
    } else {
      throw new Error('Session card not found');
    }
  });
});
