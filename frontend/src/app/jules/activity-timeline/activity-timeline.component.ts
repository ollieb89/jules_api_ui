import {
  Component,
  Input,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { JulesService } from '../../services/jules.service';
import { Activity, Plan, PlanState } from '../../models/jules.model';
import { PlanApprovalComponent } from '../plan-approval/plan-approval.component';
import { getApiErrorMessage } from '../../utils/api-error';
import { getParserErrorMessage } from '../../utils/api-parsers';

type ActivityOriginator = 'all' | 'agent' | 'user';

interface FormattedActivity extends Activity {
  formattedTime: string;
  activityType: string;
  description: string;
  originator: 'agent' | 'user';
  iconClass: string;
  originatorBadgeClass: string;
  plan?: Plan;
}

interface PlanSnapshot {
  plan: Plan;
  planGeneratedAt: string;
}

interface ActivityGroup {
  type: 'single' | 'grouped';
  activities: FormattedActivity[];
  summary: string;
  firstActivity: FormattedActivity;
  groupIndex: number;
}

@Component({
  selector: 'app-activity-timeline',
  imports: [CommonModule, FormsModule, PlanApprovalComponent, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-timeline.component.html',
  styleUrl: './activity-timeline.component.css',
})
export class ActivityTimelineComponent implements OnInit, OnChanges, AfterViewInit {
  @Input({ required: true }) sessionId!: string;
  @Input() showPagination: boolean = true;
  planStateChange = output<PlanState | null>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private julesService = inject(JulesService);
  private previousSessionId: string | null = null;

  activities = signal<Activity[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  nextPageToken = signal<string | null>(null);
  planSnapshot = signal<PlanSnapshot | null>(null);

  // Pagination state
  pageSize = signal<number>(10);
  currentPageIndex = signal<number>(0);
  pageTokens = signal<(string | null)[]>([]);
  nextTokens = signal<(string | null)[]>([]);
  currentPageActivities = signal<Activity[]>([]);

  // Originator filter
  originatorFilter = signal<ActivityOriginator>('all');

  // Expanded groups state
  expandedGroups = signal<Set<number>>(new Set());

  formattedActivities = computed<FormattedActivity[]>(() => {
    const activities = this.currentPageActivities().map((activity) => {
      const time = new Date(activity.create_time);
      let activityType = this.parseActivityType(activity);
      let description = '';
      let originator: 'agent' | 'user' = 'agent';
      let iconClass = 'bg-[var(--color-background-tertiary)] text-[var(--color-text-tertiary)]';

      if (activity.plan_generated) {
        const planSnapshot = this.planSnapshot();
        const plan =
          planSnapshot?.planGeneratedAt === activity.create_time
            ? planSnapshot.plan
            : activity.plan_generated.plan;
        activityType = 'Plan Generated';
        description = `${this.getPlanStateLabel(plan.state)} plan with ${plan.steps.length} steps`;
        originator = 'agent';
        iconClass = 'bg-[var(--color-surface-info)] text-[var(--color-text-info)]';
        return {
          ...activity,
          formattedTime: time.toLocaleString(),
          activityType,
          description,
          originator,
          iconClass,
          originatorBadgeClass:
            'bg-[var(--color-surface-info)] text-[var(--color-text-info-strong)]',
          plan,
        };
      } else if (activity.plan_approved) {
        activityType = 'Plan Approved';
        description = 'Plan has been approved';
        originator = 'user';
        iconClass = 'bg-[var(--color-surface-success)] text-[var(--color-text-success)]';
      } else if (activity.progress_updated) {
        activityType = 'Progress Updated';
        const step = activity.progress_updated;
        description = step.title || step.description || 'Progress updated';
        originator = 'agent';
        iconClass = 'bg-[var(--color-surface-warning)] text-[var(--color-text-warning)]';
      } else if (activity.session_completed) {
        activityType = 'Session Completed';
        description = 'Session has been completed';
        originator = 'agent';
        iconClass = 'bg-[var(--color-surface-accent)] text-[var(--color-text-accent)]';
      }

      const originatorBadgeClass =
        originator === 'agent'
          ? 'bg-[var(--color-surface-info)] text-[var(--color-text-info-strong)]'
          : 'bg-[var(--color-surface-success)] text-[var(--color-text-success-strong)]';

      return {
        ...activity,
        formattedTime: time.toLocaleString(),
        activityType,
        description,
        originator,
        iconClass,
        originatorBadgeClass,
      };
    });

    // Apply originator filter
    const filter = this.originatorFilter();
    if (filter === 'all') {
      return activities;
    }
    return activities.filter((activity) => activity.originator === filter);
  });

  groupedActivities = computed<ActivityGroup[]>(() => {
    const activities = this.formattedActivities();
    const groups: ActivityGroup[] = [];
    let currentProgressGroup: FormattedActivity[] = [];
    let groupIndex = 0;

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];

      if (activity.progress_updated) {
        // Add to current progress group
        currentProgressGroup.push(activity);
      } else {
        // Flush current progress group if it exists
        if (currentProgressGroup.length > 0) {
          if (currentProgressGroup.length >= 3) {
            // Create grouped item
            groups.push({
              type: 'grouped',
              activities: currentProgressGroup,
              summary: `Progress Updates (${currentProgressGroup.length} items)`,
              firstActivity: currentProgressGroup[0],
              groupIndex: groupIndex++,
            });
          } else {
            // Add individual items
            currentProgressGroup.forEach((act) => {
              groups.push({
                type: 'single',
                activities: [act],
                summary: '',
                firstActivity: act,
                groupIndex: groupIndex++,
              });
            });
          }
          currentProgressGroup = [];
        }

        // Add current non-progress activity as single item
        groups.push({
          type: 'single',
          activities: [activity],
          summary: '',
          firstActivity: activity,
          groupIndex: groupIndex++,
        });
      }
    }

    // Flush any remaining progress group
    if (currentProgressGroup.length > 0) {
      if (currentProgressGroup.length >= 3) {
        groups.push({
          type: 'grouped',
          activities: currentProgressGroup,
          summary: `Progress Updates (${currentProgressGroup.length} items)`,
          firstActivity: currentProgressGroup[0],
          groupIndex: groupIndex++,
        });
      } else {
        currentProgressGroup.forEach((act) => {
          groups.push({
            type: 'single',
            activities: [act],
            summary: '',
            firstActivity: act,
            groupIndex: groupIndex++,
          });
        });
      }
    }

    return groups;
  });

  ngOnInit(): void {
    if (!this.showPagination) {
      this.pageSize.set(100);
    }
    this.loadActivities();
    this.previousSessionId = this.sessionId;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId'] && !changes['sessionId'].firstChange) {
      const newSessionId = changes['sessionId'].currentValue;
      if (newSessionId !== this.previousSessionId) {
        // Reset pagination when sessionId changes
        this.currentPageIndex.set(0);
        this.pageTokens.set([]);
        this.nextTokens.set([]);
        this.nextPageToken.set(null);
        this.previousSessionId = newSessionId;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadActivities(null);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.length = 10000;
      this.paginator.pageSizeOptions = [5, 10, 25, 50, 100];
      this.paginator.pageIndex = 0;
      this.paginator.pageSize = this.pageSize();
    }
  }

  loadActivities(pageToken?: string | null): void {
    this.loading.set(true);
    this.error.set(null);

    if (!this.showPagination) {
      this.loadAllActivities(null, []);
      return;
    }

    this.julesService.getActivities(this.sessionId, this.pageSize(), pageToken || null).subscribe({
      next: (response) => {
        try {
          this.activities.set(response.activities);
          this.currentPageActivities.set(response.activities);
          const snapshot = this.derivePlanSnapshot(response.activities);
          this.planSnapshot.set(snapshot);
          this.planStateChange.emit(snapshot?.plan.state ?? null);
          const nextToken = response.next_page_token || null;
          this.nextPageToken.set(nextToken);

          const currentIndex = this.currentPageIndex();
          const tokens = this.pageTokens();
          const nexts = this.nextTokens();

          // Store the token used for this page and the next token from this page
          if (tokens.length <= currentIndex) {
            const newTokens = [...tokens];
            const newNexts = [...nexts];
            while (newTokens.length <= currentIndex) {
              newTokens.push(null);
              newNexts.push(null);
            }
            newTokens[currentIndex] = pageToken || null;
            newNexts[currentIndex] = nextToken;
            this.pageTokens.set(newTokens);
            this.nextTokens.set(newNexts);
          } else {
            const newNexts = [...nexts];
            newNexts[currentIndex] = nextToken;
            this.nextTokens.set(newNexts);
          }

          if (this.paginator) {
            if (nextToken) {
              this.paginator.length = 10000;
            } else {
              this.paginator.length = (currentIndex + 1) * this.pageSize();
            }
            this.paginator.pageIndex = currentIndex;
          }
          this.loading.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid activities response.'));
          this.loading.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load activities'));
        this.planSnapshot.set(null);
        this.planStateChange.emit(null);
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    const newPageIndex = event.pageIndex;
    const currentPageIndex = this.currentPageIndex();
    const pageSizeChanged = event.pageSize !== this.pageSize();

    if (pageSizeChanged) {
      this.pageSize.set(event.pageSize);
      this.currentPageIndex.set(0);
      this.pageTokens.set([]);
      this.nextTokens.set([]);
      this.nextPageToken.set(null);
      this.loadActivities(null);
      return;
    }

    if (newPageIndex > currentPageIndex) {
      const nexts = this.nextTokens();
      if (currentPageIndex < nexts.length && nexts[currentPageIndex]) {
        this.currentPageIndex.set(newPageIndex);
        this.loadActivities(nexts[currentPageIndex]);
      } else if (this.nextPageToken()) {
        this.currentPageIndex.set(newPageIndex);
        this.loadActivities(this.nextPageToken());
      }
    } else if (newPageIndex < currentPageIndex) {
      const tokens = this.pageTokens();
      const nexts = this.nextTokens();
      if (newPageIndex < tokens.length) {
        const tokenForPage = tokens[newPageIndex] || null;
        this.currentPageIndex.set(newPageIndex);
        if (newPageIndex < nexts.length) {
          this.nextPageToken.set(nexts[newPageIndex]);
        } else {
          this.nextPageToken.set(null);
        }
        this.loadActivities(tokenForPage);
      } else if (newPageIndex === 0) {
        this.currentPageIndex.set(0);
        if (nexts.length > 0) {
          this.nextPageToken.set(nexts[0]);
        } else {
          this.nextPageToken.set(null);
        }
        this.loadActivities(null);
      }
    }
  }

  private parseActivityType(activity: Activity): string {
    if (activity.plan_generated) return 'Plan Generated';
    if (activity.plan_approved) return 'Plan Approved';
    if (activity.progress_updated) return 'Progress Updated';
    if (activity.session_completed) return 'Session Completed';

    // Parse from activity.name as fallback
    const name = activity.name || '';
    const parts = name.split('/');
    const activityId = parts[parts.length - 1] || '';

    // Return capitalized activity ID or generic label
    return activityId ? `Activity ${activityId.substring(0, 8)}` : 'Activity';
  }

  toggleGroup(groupIndex: number): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    this.expandedGroups.set(newExpanded);
  }

  isGroupExpanded(groupIndex: number): boolean {
    return this.expandedGroups().has(groupIndex);
  }

  onGroupKeyDown(event: KeyboardEvent, groupIndex: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleGroup(groupIndex);
    }
  }

  private derivePlanSnapshot(activities: Activity[]): PlanSnapshot | null {
    const planGeneratedActivities = activities.filter((activity) => activity.plan_generated?.plan);
    const planApprovedActivities = activities.filter((activity) => activity.plan_approved);
    if (planGeneratedActivities.length === 0 && planApprovedActivities.length === 0) {
      return null;
    }

    const latestPlanGenerated = planGeneratedActivities.reduce<Activity | null>(
      (latest, current) => {
        if (!latest) {
          return current;
        }
        const latestTime = new Date(latest.create_time).getTime();
        const currentTime = new Date(current.create_time).getTime();
        return currentTime > latestTime ? current : latest;
      },
      null,
    );

    const latestPlanApprovedWithPlan = planApprovedActivities
      .filter((activity) => activity.plan_approved?.plan)
      .reduce<Activity | null>((latest, current) => {
        if (!latest) {
          return current;
        }
        const latestTime = new Date(latest.create_time).getTime();
        const currentTime = new Date(current.create_time).getTime();
        return currentTime > latestTime ? current : latest;
      }, null);

    const basePlan =
      latestPlanApprovedWithPlan?.plan_approved?.plan ?? latestPlanGenerated?.plan_generated?.plan;
    if (!basePlan) {
      return null;
    }

    const approvalPlan = latestPlanApprovedWithPlan?.plan_approved?.plan;
    const planSteps = approvalPlan?.steps?.length ? approvalPlan.steps : basePlan.steps;
    const planState = this.derivePlanState(
      approvalPlan?.state ?? basePlan.state,
      activities,
      latestPlanGenerated ? new Date(latestPlanGenerated.create_time).getTime() : null,
    );
    const plan: Plan = {
      ...basePlan,
      ...approvalPlan,
      state: planState,
      steps: planSteps.map((step) => ({ ...step })),
    };

    return {
      plan,
      planGeneratedAt:
        latestPlanGenerated?.create_time ?? latestPlanApprovedWithPlan?.create_time ?? '',
    };
  }

  private derivePlanState(
    baseState: PlanState,
    activities: Activity[],
    latestPlanTime: number | null,
  ): PlanState {
    const planApprovedAfter = activities.some((activity) => {
      if (!activity.plan_approved) {
        return false;
      }
      if (latestPlanTime === null) {
        return true;
      }
      return new Date(activity.create_time).getTime() >= latestPlanTime;
    });

    if (planApprovedAfter && baseState !== 'REJECTED') {
      return 'APPROVED';
    }

    if (baseState === 'STATE_UNSPECIFIED') {
      return 'PENDING';
    }

    return baseState;
  }

  private loadAllActivities(pageToken: string | null, collected: Activity[]): void {
    this.julesService.getActivities(this.sessionId, this.pageSize(), pageToken || null).subscribe({
      next: (response) => {
        try {
          const mergedActivities = [...collected, ...response.activities];
          const nextToken = response.next_page_token || null;
          if (nextToken) {
            this.loadAllActivities(nextToken, mergedActivities);
            return;
          }
          this.activities.set(mergedActivities);
          this.currentPageActivities.set(mergedActivities);
          const snapshot = this.derivePlanSnapshot(mergedActivities);
          this.planSnapshot.set(snapshot);
          this.planStateChange.emit(snapshot?.plan.state ?? null);
          this.currentPageIndex.set(0);
          this.pageTokens.set([]);
          this.nextTokens.set([]);
          this.nextPageToken.set(null);
          this.loading.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid activities response.'));
          this.loading.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load activities'));
        this.planSnapshot.set(null);
        this.planStateChange.emit(null);
        this.loading.set(false);
      },
    });
  }

  private getPlanStateLabel(state: PlanState): string {
    const labels: Record<PlanState, string> = {
      STATE_UNSPECIFIED: 'Pending',
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };
    return labels[state] || state;
  }
}
