import { Component, Input, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { JulesService } from '../../services/jules.service';
import { Plan, StepState, PlanState } from '../../models/jules.model';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-plan-approval',
  imports: [CommonModule, MatChipsModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-approval.component.html',
  styleUrl: './plan-approval.component.css',
})
export class PlanApprovalComponent {
  @Input({ required: true }) plan!: Plan;
  @Input({ required: true }) sessionId!: string;

  private julesService = inject(JulesService);
  private router = inject(Router);

  approving = signal<boolean>(false);
  error = signal<string | null>(null);

  canApprove = computed(() => {
    return this.plan.state === 'PENDING' && !this.approving();
  });

  getStepStateLabel(state: StepState): string {
    const labels: Record<StepState, string> = {
      STATE_UNSPECIFIED: 'Pending',
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
    };
    return labels[state] || state;
  }

  getPlanStateLabel(state: PlanState): string {
    const labels: Record<PlanState, string> = {
      STATE_UNSPECIFIED: 'Pending',
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };
    return labels[state] || state;
  }

  getStepStateClass(state: StepState): string {
    const classes: Record<StepState, string> = {
      STATE_UNSPECIFIED: 'mat-chip mat-standard-chip mat-mdc-chip',
      PENDING: 'mat-chip mat-standard-chip mat-mdc-chip',
      IN_PROGRESS: 'mat-chip mat-standard-chip mat-mdc-chip',
      COMPLETED: 'mat-chip mat-standard-chip mat-mdc-chip',
      FAILED: 'mat-chip mat-standard-chip mat-mdc-chip',
    };
    return classes[state] || 'mat-chip mat-standard-chip mat-mdc-chip';
  }

  getPlanStateClass(state: PlanState): string {
    const classes: Record<PlanState, string> = {
      STATE_UNSPECIFIED: 'mat-chip mat-standard-chip mat-mdc-chip',
      PENDING: 'mat-chip mat-standard-chip mat-mdc-chip',
      APPROVED: 'mat-chip mat-standard-chip mat-mdc-chip',
      REJECTED: 'mat-chip mat-standard-chip mat-mdc-chip',
    };
    return classes[state] || 'mat-chip mat-standard-chip mat-mdc-chip';
  }

  getStepStateColor(state: StepState): string {
    const colors: Record<StepState, string> = {
      STATE_UNSPECIFIED: '',
      PENDING: 'accent',
      IN_PROGRESS: 'primary',
      COMPLETED: 'primary',
      FAILED: 'warn',
    };
    return colors[state] || '';
  }

  getPlanStateColor(state: PlanState): string {
    const colors: Record<PlanState, string> = {
      STATE_UNSPECIFIED: '',
      PENDING: 'accent',
      APPROVED: 'primary',
      REJECTED: 'warn',
    };
    return colors[state] || '';
  }

  approvePlan(): void {
    if (!this.canApprove()) return;

    this.approving.set(true);
    this.error.set(null);

    this.julesService.approvePlan(this.sessionId).subscribe({
      next: () => {
        // Reload the page to show updated state
        window.location.reload();
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to approve plan'));
        this.approving.set(false);
      },
    });
  }
}
