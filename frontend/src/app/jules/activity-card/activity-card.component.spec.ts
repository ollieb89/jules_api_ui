import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityCardComponent } from './activity-card.component';
import { ClipboardService } from '../../services/clipboard.service';
import { vi } from 'vitest';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clipboardService: any;

  beforeEach(async () => {
    clipboardService = {
      copyToClipboard: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent],
      providers: [{ provide: ClipboardService, useValue: clipboardService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
  });

  it('should render plan generated activity details', () => {
    fixture.componentRef.setInput('activity', {
      name: 'activities/plan-generated',
      plan_generated: {
        plan: {
          steps: [
            { title: 'Step 1', description: 'First step', state: 'PENDING' },
            { title: 'Step 2', description: 'Second step', state: 'COMPLETED' }
          ],
          state: 'PENDING'
        }
      },
      create_time: '2024-01-01T00:00:00Z'
    });

    component.planExpanded.set(true);
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('h3')).nativeElement.textContent;
    const description = fixture.debugElement.query(By.css('p')).nativeElement.textContent;
    const steps = fixture.debugElement.queryAll(By.css('ol li'));

    expect(title).toContain('Plan Generated');
    expect(description).toContain('Plan with 2 steps');
    expect(steps.length).toBe(2);
  });

  it('should show user originator for plan approvals', () => {
    fixture.componentRef.setInput('activity', {
      name: 'activities/plan-approved',
      plan_approved: {},
      create_time: '2024-01-01T00:00:00Z'
    });

    fixture.detectChanges();

    const chipText = fixture.debugElement.query(By.css('mat-chip')).nativeElement.textContent;
    expect(chipText).toContain('User');
  });

  it('should render progress updates with artifacts when expanded', () => {
    fixture.componentRef.setInput('activity', {
      name: 'activities/progress-updated',
      progress_updated: {
        title: 'Running tests',
        description: 'Executed unit suite',
        artifacts: [
          {
            bash_output: 'npm test',
            git_patch: '@@ -1,1 +1,1 @@\n-old\n+new'
          }
        ]
      },
      create_time: '2024-01-01T00:00:00Z'
    });

    component.toggleBashOutput(0);
    component.toggleDiffExpanded(0);
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('h3')).nativeElement.textContent;
    const description = fixture.debugElement.query(By.css('p')).nativeElement.textContent;
    const bashOutput = fixture.debugElement.query(By.css('pre')).nativeElement.textContent;
    const diffLines = fixture.debugElement.queryAll(By.css('.diff-line'));

    expect(title).toContain('Progress Updated');
    expect(description).toContain('Running tests');
    expect(bashOutput).toContain('npm test');
    expect(diffLines.length).toBeGreaterThan(0);
  });

  it('should have accessibility attributes on plan toggle button', () => {
    fixture.componentRef.setInput('activity', {
      name: 'activities/plan-generated-123',
      plan_generated: {
        plan: {
          steps: [],
          state: 'PENDING'
        }
      },
      create_time: '2024-01-01T00:00:00Z'
    });
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.attributes['aria-expanded']).toBe('false');
    expect(button.attributes['aria-controls']).toBe('plan-content-activities/plan-generated-123');

    component.togglePlanExpanded();
    fixture.detectChanges();

    expect(button.attributes['aria-expanded']).toBe('true');
    const content = fixture.debugElement.query(By.css('ol'));
    expect(content.attributes['id']).toBe('plan-content-activities/plan-generated-123');
  });

  it('should show feedback when copy is successful', async () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('activity', {
      name: 'activities/progress-updated',
      progress_updated: {
        artifacts: [
          {
            bash_output: 'npm test'
          }
        ]
      },
      create_time: '2024-01-01T00:00:00Z'
    });

    component.toggleBashOutput(0);
    fixture.detectChanges();

    // Find the copy button
    // The first button is the toggle button, the second is the copy button
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const copyButton = buttons[1];

    expect(copyButton.nativeElement.textContent).toContain('Copy');

    // Click it
    copyButton.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(clipboardService.copyToClipboard).toHaveBeenCalledWith('npm test');
    expect(copyButton.nativeElement.textContent).toContain('Copied!');

    // Fast forward time
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(copyButton.nativeElement.textContent).toContain('Copy');
    vi.useRealTimers();
  });
});
