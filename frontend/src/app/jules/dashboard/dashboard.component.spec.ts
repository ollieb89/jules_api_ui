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
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('8');
  });
});
