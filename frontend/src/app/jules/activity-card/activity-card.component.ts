import { Component, input, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Activity } from '../../models/jules.model';
import { ClipboardService } from '../../services/clipboard.service';

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  lineNumber?: number;
}

@Component({
  selector: 'app-activity-card',
  imports: [CommonModule, MatChipsModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg p-4 shadow-sm"
    >
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold m-0 text-[var(--color-text-primary)]">
            {{ getActivityTitle() }}
          </h3>
          <mat-chip color="accent">
            {{ getOriginator() === 'agent' ? 'Agent' : 'User' }}
          </mat-chip>
        </div>
        <span class="text-xs text-[var(--color-text-tertiary)]">{{ getFormattedTime() }}</span>
      </div>

      <p class="text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed">
        {{ getDescription() }}
      </p>

      <!-- Plan Generated -->
      @if (activity().plan_generated) {
        <div class="mt-4">
          <button
            (click)="togglePlanExpanded()"
            type="button"
            class="flex items-center gap-2 text-sm font-medium text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
          >
            @if (planExpanded()) {
              ▼
            } @else {
              ▶
            }
            Plan Steps ({{ activity()!.plan_generated!.plan.steps.length }})
          </button>

          @if (planExpanded()) {
            <ol
              class="list-decimal list-inside space-y-2 mt-3 pl-4 border-l-2 border-[var(--color-border-default)]"
            >
              @for (step of activity()!.plan_generated!.plan.steps; track $index) {
                <li class="text-base text-[var(--color-text-primary)] leading-relaxed">
                  <span class="inline-block mr-2">{{
                    step.title || step.description || 'Step ' + ($index + 1)
                  }}</span>
                  <mat-chip [color]="getStepStateColor(step.state)" class="!ml-2">
                    {{ getStepStateLabel(step.state) }}
                  </mat-chip>
                </li>
              }
            </ol>
          }
        </div>
      }

      <!-- Progress Updated -->
      @if (activity().progress_updated) {
        <div class="mt-4">
          @if (
            activity()!.progress_updated!.artifacts &&
            activity()!.progress_updated!.artifacts!.length > 0
          ) {
            @for (artifact of activity()!.progress_updated!.artifacts; track $index) {
              @if (artifact.bash_output) {
                <div class="mt-3">
                  <button
                    (click)="toggleBashOutput($index)"
                    type="button"
                    class="flex items-center gap-2 text-sm font-medium text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                  >
                    @if (isBashOutputExpanded($index)) {
                      ▼
                    } @else {
                      ▶
                    }
                    Bash Output
                  </button>

                  @if (isBashOutputExpanded($index)) {
                    <div class="mt-2 relative">
                      <pre
                        class="bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto"
                        >{{ artifact.bash_output }}</pre
                      >
                      <button
                        (click)="copyToClipboard(artifact.bash_output || '')"
                        type="button"
                        class="absolute top-2 right-2 px-2 py-1 bg-[var(--color-background-tertiary)] hover:bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] text-xs rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>
                  }
                </div>
              }

              @if (artifact.git_patch) {
                <div class="mt-3">
                  <button
                    (click)="toggleDiffExpanded($index)"
                    type="button"
                    class="flex items-center gap-2 text-sm font-medium text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                  >
                    @if (isDiffExpanded($index)) {
                      ▼
                    } @else {
                      ▶
                    }
                    Changeset
                  </button>

                  @if (isDiffExpanded($index)) {
                    <div class="mt-2 relative">
                      <div class="diff-container">
                        @for (line of parseDiff(artifact.git_patch); track $index) {
                          <div [class]="'diff-line ' + getDiffLineClass(line.type)">
                            {{ line.content }}
                          </div>
                        }
                      </div>
                      <button
                        (click)="copyToClipboard(artifact.git_patch || '')"
                        type="button"
                        class="absolute top-2 right-2 px-2 py-1 bg-[var(--color-background-tertiary)] hover:bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] text-xs rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>
                  }
                </div>
              }
            }
          }
        </div>
      }

      <!-- Message (if we add message activity type in future) -->
      @if (activity().plan_approved || activity().session_completed) {
        <div class="mt-3 p-3 bg-[var(--color-surface-secondary)] rounded-lg">
          <p class="text-sm text-[var(--color-text-secondary)]">
            @if (activity().plan_approved) {
              Plan has been approved and execution can proceed.
            } @else if (activity().session_completed) {
              Session has been completed successfully.
            }
          </p>
        </div>
      }
    </div>
  `,
})
export class ActivityCardComponent {
  activity = input.required<Activity>();

  private clipboardService = inject(ClipboardService);

  planExpanded = signal<boolean>(false);
  private bashOutputExpandedState = signal<Record<number, boolean>>({});
  private diffExpandedState = signal<Record<number, boolean>>({});
  copySuccess = signal<Record<string, boolean>>({});

  isBashOutputExpanded = (index: number): boolean => {
    return this.bashOutputExpandedState()[index] || false;
  };

  isDiffExpanded = (index: number): boolean => {
    return this.diffExpandedState()[index] || false;
  };

  getActivityTitle(): string {
    const act = this.activity();
    if (act.plan_generated) {
      return 'Plan Generated';
    } else if (act.plan_approved) {
      return 'Plan Approved';
    } else if (act.progress_updated) {
      return 'Progress Updated';
    } else if (act.session_completed) {
      return 'Session Completed';
    }
    return 'Activity';
  }

  getDescription(): string {
    const act = this.activity();
    if (act.plan_generated) {
      return `Plan with ${act.plan_generated.plan.steps.length} steps`;
    } else if (act.plan_approved) {
      return 'Plan has been approved';
    } else if (act.progress_updated) {
      const step = act.progress_updated;
      return step.title || step.description || 'Progress updated';
    } else if (act.session_completed) {
      return 'Session has been completed';
    }
    return '';
  }

  getOriginator(): 'agent' | 'user' {
    if (this.activity().plan_approved) {
      return 'user';
    }
    return 'agent';
  }

  getOriginatorBadgeClass(): string {
    if (this.getOriginator() === 'agent') {
      return 'bg-[var(--color-surface-info)] text-[var(--color-text-info-strong)]';
    }
    return 'bg-[var(--color-surface-success)] text-[var(--color-text-success-strong)]';
  }

  getFormattedTime(): string {
    return new Date(this.activity().create_time).toLocaleString();
  }

  togglePlanExpanded(): void {
    this.planExpanded.set(!this.planExpanded());
  }

  toggleBashOutput(index: number): void {
    const current = this.bashOutputExpandedState();
    this.bashOutputExpandedState.set({ ...current, [index]: !current[index] });
  }

  toggleDiffExpanded(index: number): void {
    const current = this.diffExpandedState();
    this.diffExpandedState.set({ ...current, [index]: !current[index] });
  }

  parseDiff(patch: string): DiffLine[] {
    const lines = patch.split('\n');
    return lines.map((line) => {
      if (line.startsWith('@@')) {
        return { type: 'header', content: line };
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        return { type: 'add', content: line };
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return { type: 'remove', content: line };
      } else {
        return { type: 'context', content: line };
      }
    });
  }

  getDiffLineClass(type: DiffLine['type']): string {
    switch (type) {
      case 'add':
        return 'diff-line-add';
      case 'remove':
        return 'diff-line-remove';
      case 'header':
        return 'diff-line-header';
      default:
        return 'diff-line-context';
    }
  }

  getStepStateLabel(state: string): string {
    const labels: Record<string, string> = {
      STATE_UNSPECIFIED: 'Pending',
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
    };
    return labels[state] || state;
  }

  getStepStateClass(): string {
    return 'mat-chip mat-standard-chip mat-mdc-chip';
  }

  getStepStateColor(state: string): string {
    const colors: Record<string, string> = {
      STATE_UNSPECIFIED: '',
      PENDING: 'accent',
      IN_PROGRESS: 'primary',
      COMPLETED: 'primary',
      FAILED: 'warn',
    };
    return colors[state] || '';
  }

  async copyToClipboard(text: string): Promise<void> {
    const success = await this.clipboardService.copyToClipboard(text);
    if (success) {
      const current = this.copySuccess();
      this.copySuccess.set({ ...current, [text.substring(0, 20)]: true });
      setTimeout(() => {
        const updated = this.copySuccess();
        delete updated[text.substring(0, 20)];
        this.copySuccess.set({ ...updated });
      }, 2000);
    }
  }
}
