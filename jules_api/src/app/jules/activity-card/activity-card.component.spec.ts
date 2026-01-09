import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivityCardComponent } from './activity-card.component';
import { ClipboardService } from '../../services/clipboard.service';
import { vi } from 'vitest';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;
  let clipboardService: { copyToClipboard: ReturnType<typeof vi.fn> };

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
});
