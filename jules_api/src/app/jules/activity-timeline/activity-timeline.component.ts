import { Component, Input, signal, ChangeDetectionStrategy, inject, computed, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { JulesService } from '../../services/jules.service';
import { Activity, JulesApiError } from '../../models/jules.model';
import { getApiErrorMessage } from '../../utils/api-error';
import { PlanApprovalComponent } from '../plan-approval/plan-approval.component';

type ActivityOriginator = 'all' | 'agent' | 'user';

interface FormattedActivity extends Activity {
  formattedTime: string;
  activityType: string;
  description: string;
  originator: 'agent' | 'user';
  iconClass: string;
  originatorBadgeClass: string;
}

@Component({
  selector: 'app-activity-timeline',
  imports: [CommonModule, FormsModule, PlanApprovalComponent, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-timeline.component.html',
  styleUrl: './activity-timeline.component.css'
})
export class ActivityTimelineComponent implements OnInit, OnChanges, AfterViewInit {
  @Input({ required: true }) sessionId!: string;
  @Input() showPagination: boolean = true;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  private julesService = inject(JulesService);
  private previousSessionId: string | null = null;

  activities = signal<Activity[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  nextPageToken = signal<string | null>(null);
  
  // Pagination state
  pageSize = signal<number>(10);
  currentPageIndex = signal<number>(0);
  pageTokens = signal<(string | null)[]>([]);
  nextTokens = signal<(string | null)[]>([]);
  currentPageActivities = signal<Activity[]>([]);
  
  // Originator filter
  originatorFilter = signal<ActivityOriginator>('all');

  formattedActivities = computed<FormattedActivity[]>(() => {
    const activities = this.currentPageActivities().map(activity => {
      const time = new Date(activity.create_time);
      let activityType = this.parseActivityType(activity);
      let description = '';
      let originator: 'agent' | 'user' = 'agent';
      let iconClass = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';

      if (activity.plan_generated) {
        activityType = 'Plan Generated';
        description = `Plan with ${activity.plan_generated.plan.steps.length} steps`;
        originator = 'agent';
        iconClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      } else if (activity.plan_approved) {
        activityType = 'Plan Approved';
        description = 'Plan has been approved';
        originator = 'user';
        iconClass = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      } else if (activity.progress_updated) {
        activityType = 'Progress Updated';
        const step = activity.progress_updated;
        description = step.title || step.description || 'Progress updated';
        originator = 'agent';
        iconClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      } else if (activity.session_completed) {
        activityType = 'Session Completed';
        description = 'Session has been completed';
        originator = 'agent';
        iconClass = 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      }

      const originatorBadgeClass = originator === 'agent'
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';

      return {
        ...activity,
        formattedTime: time.toLocaleString(),
        activityType,
        description,
        originator,
        iconClass,
        originatorBadgeClass
      };
    });
    
    // Apply originator filter
    const filter = this.originatorFilter();
    if (filter === 'all') {
      return activities;
    }
    return activities.filter(activity => activity.originator === filter);
  });

  ngOnInit(): void {
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

    this.julesService.getActivities(this.sessionId, this.pageSize(), pageToken || null).subscribe({
      next: (response) => {
        this.activities.set(response.activities);
        this.currentPageActivities.set(response.activities);
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
      },
      error: (err: JulesApiError) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load activities'));
        this.loading.set(false);
      }
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
}
