import { Component, Input, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JulesService } from '../../services/jules.service';
import { Plan, Step, StepState, PlanState } from '../../models/jules.model';

@Component({
  selector: 'app-plan-approval',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-approval.component.html',
  styleUrl: './plan-approval.component.css'
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
      'STATE_UNSPECIFIED': 'Unknown',
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    return labels[state] || state;
  }

  getStepStateClass(state: StepState): string {
    const classes: Record<StepState, string> = {
      'STATE_UNSPECIFIED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return classes[state] || 'bg-gray-100 text-gray-800';
  }

  getPlanStateClass(state: PlanState): string {
    const classes: Record<PlanState, string> = {
      'STATE_UNSPECIFIED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return classes[state] || 'bg-gray-100 text-gray-800';
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
      error: (err) => {
        this.error.set(err.message || 'Failed to approve plan');
        this.approving.set(false);
      }
    });
  }
}

