import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import { Source } from '../../models/jules.model';

@Component({
  selector: 'app-session-create',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-create.component.html',
  styleUrl: './session-create.component.css'
})
export class SessionCreateComponent {
  private julesService = inject(JulesService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  sources = signal<Source[]>([]);
  loading = signal<boolean>(false);
  loadingSources = signal<boolean>(false);
  error = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    prompt: ['', [Validators.required, Validators.minLength(10)]],
    source: ['', Validators.required]
  });

  constructor() {
    this.loadSources();
  }

  loadSources(): void {
    this.loadingSources.set(true);
    this.julesService.getSources().subscribe({
      next: (response) => {
        this.sources.set(response.sources);
        this.loadingSources.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load sources');
        this.loadingSources.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading.set(true);
      this.error.set(null);

      const formValue = this.form.value;
      this.julesService.createSession({
        prompt: formValue.prompt,
        source: formValue.source
      }).subscribe({
      next: (session) => {
        // Extract ID from full name (format: sessions/{id})
        const id = session.name.split('/').pop() || session.name;
        this.router.navigate(['/jules', id]);
      },
        error: (err) => {
          this.error.set(err.message || 'Failed to create session');
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/jules']);
  }

  get prompt() {
    return this.form.get('prompt');
  }

  get source() {
    return this.form.get('source');
  }
}

