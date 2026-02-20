import { Component, input, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownModule } from 'ngx-markdown';

import { Activity, StepState, PlanState } from '../../models/jules.model';
import { ClipboardService } from '../../services/clipboard.service';
import { CodeBlockStyleDirective } from '../../directives/code-block-style.directive';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MarkdownModule,
    CodeBlockStyleDirective
  ],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityCardComponent {
  activity = input.required<Activity>();
  planExpanded = signal(false);
  bashOutputExpanded = signal<Record<number, boolean>>({});
  diffExpanded = signal<Record<number, boolean>>({});
  
  private clipboardService = inject(ClipboardService);

  getActivityTypeLabel(activity: Activity): string {
    if (activity.plan_generated) return 'Plan Generated';
    if (activity.plan_approved) return 'Plan Approved';
    if (activity.plan_rejected) return 'Plan Rejected';
    if (activity.progress_updated) return 'Progress Updated';
    if (activity.error_occurred) return 'Error Occurred';
    return 'Unknown Activity';
  }

  getActivityIcon(activity: Activity): string {
    if (activity.plan_generated) return 'assignment';
    if (activity.plan_approved) return 'check_circle';
    if (activity.plan_rejected) return 'cancel';
    if (activity.progress_updated) return 'update';
    if (activity.error_occurred) return 'error';
    return 'info';
  }

  getActivityColorClass(activity: Activity): string {
    if (activity.plan_generated) return 'text-blue-500';
    if (activity.plan_approved) return 'text-green-500';
    if (activity.plan_rejected) return 'text-red-500';
    if (activity.progress_updated) return 'text-purple-500';
    if (activity.error_occurred) return 'text-red-600';
    return 'text-gray-500';
  }

  togglePlanExpanded(): void {
    this.planExpanded.update(v => !v);
  }

  toggleBashOutput(index: number): void {
    this.bashOutputExpanded.update(state => ({
      ...state,
      [index]: !state[index]
    }));
  }

  toggleDiffExpanded(index: number): void {
    this.diffExpanded.update(state => ({
      ...state,
      [index]: !state[index]
    }));
  }

  copyToClipboard(text: string): void {
    this.clipboardService.copyToClipboard(text);
  }

  getStepStateLabel(state: StepState): string {
    const labels: Record<StepState, string> = {
      'STATE_UNSPECIFIED': 'Pending',
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'SKIPPED': 'Skipped'
    };
    return labels[state] || state;
  }

  getStepStateClass(state: StepState): string {
    const classes: Record<StepState, string> = {
      'STATE_UNSPECIFIED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'SKIPPED': 'bg-yellow-100 text-yellow-800'
    };
    return classes[state] || 'bg-gray-100 text-gray-800';
  }

  getStepStateIcon(state: StepState): string {
    const icons: Record<StepState, string> = {
      'STATE_UNSPECIFIED': 'schedule',
      'PENDING': 'schedule',
      'IN_PROGRESS': 'pending',
      'COMPLETED': 'check_circle',
      'FAILED': 'error',
      'SKIPPED': 'skip_next'
    };
    return icons[state] || 'help';
  }

  getPlanStateLabel(state: PlanState): string {
    const labels: Record<PlanState, string> = {
      'STATE_UNSPECIFIED': 'Unknown',
      'PENDING_APPROVAL': 'Pending Approval',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Cancelled'
    };
    return labels[state] || state;
  }

  getPlanStateColor(state: PlanState): string {
    const colors: Record<PlanState, string> = {
      'STATE_UNSPECIFIED': 'gray',
      'PENDING_APPROVAL': 'blue',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'IN_PROGRESS': 'purple',
      'COMPLETED': 'green',
      'FAILED': 'red',
      'CANCELLED': 'gray'
    };
    return colors[state] || 'gray';
  }
}
