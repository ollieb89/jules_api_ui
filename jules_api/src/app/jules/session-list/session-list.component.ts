import { Component, OnInit, signal, ChangeDetectionStrategy, inject, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { JulesService } from '../../services/jules.service';
import { Session, SessionState } from '../../models/jules.model';

interface FormattedSession extends Session {
  formattedCreateTime: string;
  formattedUpdateTime: string;
  stateBadgeClass: string;
}

@Component({
  selector: 'app-session-list',
  imports: [CommonModule, RouterModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.css'
})
export class SessionListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private julesService = inject(JulesService);
  private router = inject(Router);

  sessions = signal<Session[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  nextPageToken = signal<string | null>(null);
  
  // Pagination state
  pageSize = signal<number>(10);
  currentPageIndex = signal<number>(0);
  // Store tokens: tokens[i] = token used to get page i, nextTokens[i] = next_page_token from page i
  pageTokens = signal<(string | null)[]>([]);
  nextTokens = signal<(string | null)[]>([]);
  currentPageSessions = signal<Session[]>([]); // Sessions for current page only

  formattedSessions = computed<FormattedSession[]>(() => {
    return this.currentPageSessions().map(session => {
      const createTime = new Date(session.create_time);
      const updateTime = new Date(session.update_time);
      
      let stateBadgeClass = 'bg-gray-100 text-gray-800';
      if (session.state === 'ACTIVE') {
        stateBadgeClass = 'bg-blue-100 text-blue-800';
      } else if (session.state === 'COMPLETED') {
        stateBadgeClass = 'bg-green-100 text-green-800';
      } else if (session.state === 'FAILED') {
        stateBadgeClass = 'bg-red-100 text-red-800';
      }

      return {
        ...session,
        formattedCreateTime: createTime.toLocaleString(),
        formattedUpdateTime: updateTime.toLocaleString(),
        stateBadgeClass
      };
    });
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    // Set initial paginator configuration
    if (this.paginator) {
      this.paginator.length = 10000; // Large number to enable next button
      this.paginator.pageSizeOptions = [5, 10, 25, 50, 100];
      this.paginator.pageIndex = 0;
      this.paginator.pageSize = this.pageSize();
    }
  }

  loadSessions(pageToken?: string | null): void {
    this.loading.set(true);
    this.error.set(null);

    this.julesService.getSessions(this.pageSize(), pageToken || null).subscribe({
      next: (response) => {
        this.sessions.set(response.sessions);
        this.currentPageSessions.set(response.sessions);
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
          // Update next token for this page
          const newNexts = [...nexts];
          newNexts[currentIndex] = nextToken;
          this.nextTokens.set(newNexts);
        }
        
        // Update paginator length based on whether there are more pages
        if (this.paginator) {
          if (nextToken) {
            // If there's a next page, keep length high to show next button
            this.paginator.length = 10000;
          } else {
            // If no next page, set length to current position + page size
            this.paginator.length = (currentIndex + 1) * this.pageSize();
          }
          // Update page index to match current state
          this.paginator.pageIndex = currentIndex;
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load sessions');
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    const newPageIndex = event.pageIndex;
    const currentPageIndex = this.currentPageIndex();
    const pageSizeChanged = event.pageSize !== this.pageSize();

    if (pageSizeChanged) {
      // Reset to first page when page size changes
      this.pageSize.set(event.pageSize);
      this.currentPageIndex.set(0);
      this.pageTokens.set([]);
      this.nextTokens.set([]);
      this.nextPageToken.set(null);
      this.loadSessions(null);
      return;
    }

    if (newPageIndex > currentPageIndex) {
      // Going forward - navigate to next page
      const nexts = this.nextTokens();
      if (currentPageIndex < nexts.length && nexts[currentPageIndex]) {
        // Use the stored next token from current page
        this.currentPageIndex.set(newPageIndex);
        this.loadSessions(nexts[currentPageIndex]);
      } else if (this.nextPageToken()) {
        // Fallback to current nextPageToken if not in array yet
        this.currentPageIndex.set(newPageIndex);
        this.loadSessions(this.nextPageToken());
      }
    } else if (newPageIndex < currentPageIndex) {
      // Going backward - use stored token
      const tokens = this.pageTokens();
      const nexts = this.nextTokens();
      if (newPageIndex < tokens.length) {
        // Get the token for the target page
        const tokenForPage = tokens[newPageIndex] || null;
        this.currentPageIndex.set(newPageIndex);
        // Restore the next token for this page if we have it stored
        if (newPageIndex < nexts.length) {
          this.nextPageToken.set(nexts[newPageIndex]);
        } else {
          this.nextPageToken.set(null);
        }
        this.loadSessions(tokenForPage);
      } else if (newPageIndex === 0) {
        // Going back to first page
        this.currentPageIndex.set(0);
        if (nexts.length > 0) {
          this.nextPageToken.set(nexts[0]);
        } else {
          this.nextPageToken.set(null);
        }
        this.loadSessions(null);
      }
    }
  }

  deleteSession(sessionId: string): void {
    if (confirm('Are you sure you want to delete this session?')) {
      this.julesService.deleteSession(sessionId).subscribe({
        next: () => {
          // Reload current page to refresh data
          const tokens = this.pageTokens();
          const currentIndex = this.currentPageIndex();
          const currentToken = currentIndex < tokens.length ? tokens[currentIndex] : null;
          this.loadSessions(currentToken);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete session');
        }
      });
    }
  }

  createSession(): void {
    this.router.navigate(['/jules/create']);
  }

  viewSession(sessionName: string): void {
    // Extract ID from full name (format: sessions/{id})
    const id = sessionName.split('/').pop() || sessionName;
    this.router.navigate(['/jules', id]);
  }

  getStateLabel(state: SessionState): string {
    const labels: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'Unknown',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    return labels[state] || state;
  }
}

