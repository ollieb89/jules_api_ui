import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityTimelineComponent } from './activity-timeline.component';
import { JulesService } from '../../services/jules.service';
import { ClipboardService } from '../../services/clipboard.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ActivityTimelineComponent', () => {
  let component: ActivityTimelineComponent;
  let fixture: ComponentFixture<ActivityTimelineComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let julesService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clipboardService: any;

  beforeEach(async () => {
    julesService = {
      getActivities: vi.fn().mockReturnValue(of({
        activities: [
          {
            name: 'activities/progress-updated-1',
            create_time: '2024-01-01T00:00:00Z',
            progress_updated: {
              title: 'Progress',
              artifacts: [
                { bash_output: 'echo test' }
              ]
            }
          }
        ],
        next_page_token: null
      }))
    };

    clipboardService = {
      copyToClipboard: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [ActivityTimelineComponent, NoopAnimationsModule],
      providers: [
        { provide: JulesService, useValue: julesService },
        { provide: ClipboardService, useValue: clipboardService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTimelineComponent);
    component = fixture.componentInstance;
    component.sessionId = '123';
    fixture.detectChanges();
  });

  it('should render progress updated activity with artifact toggle', () => {
    const toggleButton = fixture.debugElement.query(By.css('button[aria-controls^="bash-output-"]'));
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.attributes['aria-expanded']).toBe('false');
  });

  it('should toggle artifact visibility', () => {
    const toggleButton = fixture.debugElement.query(By.css('button[aria-controls^="bash-output-"]'));

    // Expand
    toggleButton.nativeElement.click();
    fixture.detectChanges();

    expect(toggleButton.attributes['aria-expanded']).toBe('true');
    const content = fixture.debugElement.query(By.css('pre'));
    expect(content.nativeElement.textContent).toContain('echo test');
  });

  it('should copy artifact content', async () => {
    // Expand first
    const toggleButton = fixture.debugElement.query(By.css('button[aria-controls^="bash-output-"]'));
    toggleButton.nativeElement.click();
    fixture.detectChanges();

    const copyButton = fixture.debugElement.query(By.css('button[aria-label="Copy bash output"]'));
    expect(copyButton).toBeTruthy();

    copyButton.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(clipboardService.copyToClipboard).toHaveBeenCalledWith('echo test');
    expect(copyButton.nativeElement.textContent).toContain('Copied!');
  });
});
