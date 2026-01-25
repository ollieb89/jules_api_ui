import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
// @ts-ignore: ignore missing types for ngx-markdown
import { MarkdownComponent } from 'ngx-markdown';
import { JulesService } from '../../services/jules.service';
import { JulesStreamService } from '../../services/jules-stream.service';
import { PlanState, Session, SessionState } from '../../models/jules.model';
import { ActivityTimelineComponent } from '../activity-timeline/activity-timeline.component';
import { CodeBlockStyleDirective } from '../../directives/code-block-style.directive';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { getApiErrorMessage } from '../../utils/api-error';
import { getParserErrorMessage, parseSessionResponse } from '../../utils/api-parsers';

interface PRInfo {
  url?: string;
  number?: number;
  status?: 'open' | 'merged' | 'closed';
}

@Component({
  selector: 'app-session-detail',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ActivityTimelineComponent,
    MarkdownComponent,
    CodeBlockStyleDirective,
    LoadingSpinnerComponent,
    ConfirmationDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css',
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  private julesService = inject(JulesService);
  private streamService = inject(JulesStreamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('deleteDialog') deleteDialog!: ConfirmationDialogComponent;
  @ViewChild(ActivityTimelineComponent) activityTimeline?: ActivityTimelineComponent;

  session = signal<Session | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  sessionId = signal<string>('');

  // PR information (placeholder - would come from session metadata or activities)
  prInfo = signal<PRInfo | null>(null);

  // Collapsible sections state
  activitiesExpanded = signal<boolean>(true);

  // SSE connection state
  streamConnected = signal<boolean>(false);

  private streamSubscription: Subscription | null = null;
  private lastSessionUpdateTime: string | null = null;
  private lastActivityId: number | null = null;

  messageForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  sendingMessage = signal<boolean>(false);
  approvingPlan = signal<boolean>(false);
  refreshing = signal<boolean>(false);
  planStateFromActivities = signal<PlanState | null>(null);

  canApprovePlan = computed(() => {
    const currentSession = this.session();
    const state = this.planStateFromActivities();
    const hasPendingPlan = state === 'PENDING' || state === 'STATE_UNSPECIFIED';
    return Boolean(currentSession && currentSession.state === 'ACTIVE' && hasPendingPlan);
  });

  activityCount = computed(() => {
    return this.activityTimeline?.activities().length ?? 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);

      if (isPlatformBrowser(this.platformId)) {
        this.loadSession();
        this.startLiveUpdates();

        // Check for action query param (e.g., ?action=message)
        this.route.queryParams.subscribe((params) => {
          if (params['action'] === 'message' && this.session()) {
            // Focus message input (would need ViewChild for actual focus)
          }
        });
      }
    } else {
      this.error.set('Session ID is required');
    }
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = null;
  }

  loadSession(): void {
    this.loading.set(true);
    this.error.set(null);

    this.julesService.getSession(this.sessionId()).subscribe({
      next: (session) => {
        try {
          const parsed = parseSessionResponse(session);
          this.session.set(parsed);
          this.lastSessionUpdateTime = parsed.update_time ?? null;
          this.loading.set(false);
          // Extract PR info from session if available (placeholder)
          // this.extractPRInfo(session);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid session response.'));
          this.loading.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load session'));
        this.loading.set(false);
      },
    });
  }

  refreshSession(): void {
    this.refreshing.set(true);
    this.loadSession();
    setTimeout(() => {
      this.refreshing.set(false);
    }, 500);
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      this.sendingMessage.set(true);
      const message = this.messageForm.get('message')?.value;

      this.julesService.sendMessage(this.sessionId(), { message }).subscribe({
        next: (session) => {
          try {
            const parsed = parseSessionResponse(session);
            this.session.set(parsed);
            this.messageForm.reset();
            this.sendingMessage.set(false);
          } catch (error) {
            this.error.set(getParserErrorMessage(error, 'Invalid session response.'));
            this.sendingMessage.set(false);
          }
        },
        error: (err: unknown) => {
          this.error.set(getApiErrorMessage(err, 'Failed to send message'));
          this.sendingMessage.set(false);
        },
      });
    }
  }

  approvePlan(): void {
    if (!this.canApprovePlan()) return;

    this.approvingPlan.set(true);
    this.error.set(null);

    this.julesService.approvePlan(this.sessionId()).subscribe({
      next: (session) => {
        try {
          const parsed = parseSessionResponse(session);
          this.session.set(parsed);
          this.approvingPlan.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid session response.'));
          this.approvingPlan.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to approve plan'));
        this.approvingPlan.set(false);
      },
    });
  }

  deleteSession(): void {
    this.deleteDialog.showModal();
  }

  onDeleteConfirmed(): void {
    this.julesService.deleteSession(this.sessionId()).subscribe({
      next: () => {
        this.deleteDialog.reset();
        this.router.navigate(['/jules']);
      },
      error: (err: unknown) => {
        this.deleteDialog.reset();
        this.error.set(getApiErrorMessage(err, 'Failed to delete session'));
      },
    });
  }

  toggleActivities(): void {
    this.activitiesExpanded.set(!this.activitiesExpanded());
  }

  onPlanStateChange(state: PlanState | null): void {
    this.planStateFromActivities.set(state);
  }

  private startLiveUpdates(): void {
    if (this.streamSubscription) {
      return;
    }

    this.streamSubscription = this.streamService
      .sessionStream(this.sessionId(), {
        pollIntervalSeconds: 60,
        lastUpdate: this.lastSessionUpdateTime,
        lastActivityId: this.lastActivityId,
      })
      .subscribe({
        next: (event) => {
          if (event.type === 'open') {
            this.streamConnected.set(true);
            return;
          }
          if (event.type === 'error') {
            this.streamConnected.set(false);
            return;
          }
          if (event.type === 'session_update') {
            this.session.set(event.session);
            this.lastSessionUpdateTime = event.session.update_time ?? null;
            return;
          }
          if (event.type === 'activity_update') {
            if (!event.latestActivityId || event.latestActivityId !== this.lastActivityId) {
              this.lastActivityId = event.latestActivityId ?? this.lastActivityId;
              this.activityTimeline?.loadActivities(null);
            }
          }
        },
        complete: () => {
          this.streamConnected.set(false);
          this.streamSubscription = null;
        },
      });
  }

  getStateLabel(state: SessionState): string {
    const labels: Record<SessionState, string> = {
      STATE_UNSPECIFIED: 'Pending',
      ACTIVE: 'Active',
      IN_PROGRESS: 'In Progress',
      AWAITING_USER_FEEDBACK: 'Awaiting Feedback',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
    };
    return labels[state] || state;
  }

  getStateBadgeClass(state: SessionState): string {
    const classes: Record<SessionState, string> = {
      STATE_UNSPECIFIED: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]',
      ACTIVE: 'bg-[var(--color-surface-info)] text-[var(--color-text-info-strong)]',
      IN_PROGRESS: 'bg-[var(--color-surface-info)] text-[var(--color-text-info-strong)]',
      AWAITING_USER_FEEDBACK:
        'bg-[var(--color-surface-warning)] text-[var(--color-text-warning-strong)]',
      COMPLETED: 'bg-[var(--color-surface-success)] text-[var(--color-text-success-strong)]',
      FAILED: 'bg-[var(--color-surface-error)] text-[var(--color-text-error-strong)]',
    };
    return (
      classes[state] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
    );
  }

  getPRStatusBadgeClass(status?: string): string {
    if (!status) return 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]';
    switch (status) {
      case 'open':
        return 'bg-[var(--color-surface-success)] text-[var(--color-text-success-strong)]';
      case 'merged':
        return 'bg-[var(--color-surface-accent)] text-[var(--color-text-accent-strong)]';
      case 'closed':
        return 'bg-[var(--color-surface-error)] text-[var(--color-text-error-strong)]';
      default:
        return 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatPrompt(prompt: string): string {
    if (!prompt) return prompt;

    let formatted = prompt;

    // Make "Task:" bold at the start of lines (handle both "Task:" and "**Task:**")
    formatted = formatted.replace(/^(\*\*)?Task:(\*\*)?/gm, '**Task:**');

    // Add newline after "Details:" if it exists
    formatted = formatted.replace(/Details:\s*/g, 'Details:\n\n');

    // Make "File:", "Description:", and "Language:" bold in list items
    // Match patterns like "- File: ..." or "* File: ..." or just "File: ..." in list items
    formatted = formatted.replace(/^(\s*[-*]\s*)(File:)/gm, '$1**$2**');
    formatted = formatted.replace(/^(\s*[-*]\s*)(Description:)/gm, '$1**$2**');
    formatted = formatted.replace(/^(\s*[-*]\s*)(Language:)/gm, '$1**$2**');

    // Clean up orphaned ** markers (standalone ** on their own line or in empty paragraphs)
    // Remove lines that are just ** or whitespace + **
    formatted = formatted.replace(/^\s*\*\*\s*$/gm, '');
    // Remove ** that appear alone between newlines
    formatted = formatted.replace(/\n\s*\*\*\s*\n/g, '\n');
    // Remove ** at the start or end of lines with nothing else
    formatted = formatted.replace(/^\*\*\s+/gm, '');
    formatted = formatted.replace(/\s+\*\*$/gm, '');

    return formatted;
  }

  get message() {
    return this.messageForm.get('message');
  }
}
