import { Component, OnInit, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// @ts-ignore: ignore missing types for ngx-markdown
import { MarkdownComponent } from 'ngx-markdown';
import { JulesService } from '../../services/jules.service';
import { Session, SessionState } from '../../models/jules.model';
import { ActivityTimelineComponent } from '../activity-timeline/activity-timeline.component';
import { CodeBlockStyleDirective } from '../../directives/code-block-style.directive';

interface PRInfo {
  url?: string;
  number?: number;
  status?: 'open' | 'merged' | 'closed';
}

@Component({
  selector: 'app-session-detail',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ActivityTimelineComponent, MarkdownComponent, CodeBlockStyleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css'
})
export class SessionDetailComponent implements OnInit {
  private julesService = inject(JulesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  session = signal<Session | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  sessionId = signal<string>('');
  
  // PR information (placeholder - would come from session metadata or activities)
  prInfo = signal<PRInfo | null>(null);
  
  // Collapsible sections state
  activitiesExpanded = signal<boolean>(true);
  
  // WebSocket connection state (placeholder for future implementation)
  websocketConnected = signal<boolean>(false);

  messageForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]]
  });

  sendingMessage = signal<boolean>(false);
  approvingPlan = signal<boolean>(false);
  refreshing = signal<boolean>(false);

  // Check if session has a pending plan
  hasPendingPlan = computed(() => {
    // This would check activities for a pending plan
    // For now, return false as placeholder
    return false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      this.loadSession();
      
      // Check for action query param (e.g., ?action=message)
      this.route.queryParams.subscribe(params => {
        if (params['action'] === 'message' && this.session()) {
          // Focus message input (would need ViewChild for actual focus)
        }
      });
    } else {
      this.error.set('Session ID is required');
    }
    
    // Initialize WebSocket connection (placeholder)
    // this.initializeWebSocket();
  }

  loadSession(): void {
    this.loading.set(true);
    this.error.set(null);

    this.julesService.getSession(this.sessionId()).subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
        // Extract PR info from session if available (placeholder)
        // this.extractPRInfo(session);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load session');
        this.loading.set(false);
      }
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
          this.session.set(session);
          this.messageForm.reset();
          this.sendingMessage.set(false);
          this.refreshSession();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to send message');
          this.sendingMessage.set(false);
        }
      });
    }
  }

  approvePlan(): void {
    if (!this.hasPendingPlan()) return;
    
    this.approvingPlan.set(true);
    this.error.set(null);

    this.julesService.approvePlan(this.sessionId()).subscribe({
      next: (session) => {
        this.session.set(session);
        this.approvingPlan.set(false);
        this.refreshSession();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to approve plan');
        this.approvingPlan.set(false);
      }
    });
  }

  deleteSession(): void {
    if (confirm('Are you sure you want to delete this session?')) {
      this.julesService.deleteSession(this.sessionId()).subscribe({
        next: () => {
          this.router.navigate(['/jules']);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete session');
        }
      });
    }
  }

  toggleActivities(): void {
    this.activitiesExpanded.set(!this.activitiesExpanded());
  }

  // Placeholder for WebSocket initialization
  // private initializeWebSocket(): void {
  //   // Future: Connect to django-channels WebSocket
  //   // const ws = new WebSocket('ws://localhost:8444/ws/jules/sessions/' + this.sessionId());
  //   // ws.onopen = () => this.websocketConnected.set(true);
  //   // ws.onmessage = (event) => {
  //   //   const data = JSON.parse(event.data);
  //   //   if (data.type === 'session_update') {
  //   //     this.loadSession();
  //   //   }
  //   // };
  // }

  getStateLabel(state: SessionState): string {
    const labels: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'Pending',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    return labels[state] || state;
  }

  getStateBadgeClass(state: SessionState): string {
    const classes: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      'ACTIVE': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      'COMPLETED': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      'FAILED': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    return classes[state] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }

  getPRStatusBadgeClass(status?: string): string {
    if (!status) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    switch (status) {
      case 'open':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'merged':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'closed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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
