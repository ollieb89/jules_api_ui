import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import { Session, SessionState } from '../../models/jules.model';
import { ActivityTimelineComponent } from '../activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-session-detail',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ActivityTimelineComponent],
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

  messageForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]]
  });

  sendingMessage = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      this.loadSession();
    } else {
      this.error.set('Session ID is required');
    }
  }

  loadSession(): void {
    this.loading.set(true);
    this.error.set(null);

    this.julesService.getSession(this.sessionId()).subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load session');
        this.loading.set(false);
      }
    });
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
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to send message');
          this.sendingMessage.set(false);
        }
      });
    }
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

  getStateLabel(state: SessionState): string {
    const labels: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'Unknown',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    return labels[state] || state;
  }

  getStateBadgeClass(state: SessionState): string {
    const classes: Record<SessionState, string> = {
      'STATE_UNSPECIFIED': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return classes[state] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  get message() {
    return this.messageForm.get('message');
  }
}

