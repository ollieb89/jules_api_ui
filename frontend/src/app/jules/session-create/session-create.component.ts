import { Component, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import { CreateSession, Source } from '../../models/jules.model';
import { getApiErrorMessage } from '../../utils/api-error';
import { parseSourcesResponse, getParserErrorMessage } from '../../utils/api-parsers';
import { ClipboardService } from '../../services/clipboard.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

type WizardStep = 1 | 2 | 3;

@Component({
  selector: 'app-session-create',
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Create New Session</h1>
        <p class="text-[var(--color-text-secondary)]">
          Start a new coding session with Jules AI agent
        </p>
      </div>

      <!-- Step Indicator -->
      <nav aria-label="Progress" class="mb-8">
        <ol class="flex items-center justify-between">
          @for (step of [1, 2, 3]; track step) {
            <li
              class="flex items-center flex-1"
              [attr.aria-current]="currentStep() === step ? 'step' : null"
            >
              <div class="flex flex-col items-center">
                <div
                  [class]="
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ' +
                    getStepCircleClass(step)
                  "
                  aria-hidden="true"
                >
                  @if (currentStep() > step) {
                    ✓
                  } @else {
                    {{ step }}
                  }
                </div>
                <span [class]="'mt-2 text-xs font-medium ' + getStepLabelClass(step)">
                  <span class="sr-only">Step {{ step }}: </span>
                  @switch (step) {
                    @case (1) {
                      Select Source
                    }
                    @case (2) {
                      Configure
                    }
                    @case (3) {
                      Review
                    }
                  }
                </span>
              </div>
              @if (step < 3) {
                <div
                  [class]="
                    'flex-1 h-0.5 mx-4 ' +
                    (currentStep() > step
                      ? 'bg-[var(--color-interactive-primary)]'
                      : 'bg-[var(--color-border-strong)]')
                  "
                  aria-hidden="true"
                ></div>
              }
            </li>
          }
        </ol>
      </nav>

      @if (error()) {
        <div
          class="bg-[var(--color-surface-error)] border border-[var(--color-border-error)] text-[var(--color-text-error)] px-4 py-3 rounded mb-4"
          role="alert"
          aria-live="assertive"
        >
          {{ error() }}
        </div>
      }

      <!-- Step 1: Select Source -->
      @if (currentStep() === 1) {
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6" [formGroup]="form">
          <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
            Select GitHub Repository
          </h2>

          @if (loadingSources()) {
            <div class="text-[var(--color-text-secondary)]">Loading repositories...</div>
          } @else if (sources().length === 0) {
            <div
              class="bg-[var(--color-surface-warning)] border border-[var(--color-border-warning)] text-[var(--color-text-warning)] px-4 py-3 rounded mb-4"
            >
              No repositories found. Please configure your GitHub connection.
            </div>
          } @else {
            <div class="mb-6">
              <label
                for="source"
                class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
              >
                Repository <span class="text-[var(--color-text-error)]">*</span>
                <span class="text-xs text-[var(--color-text-tertiary)] ml-2"
                  >({{ sources().length }} available)</span
                >
              </label>
              <select
                id="source"
                formControlName="source"
                class="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                style="color-scheme: light dark;"
                [style.borderColor]="
                  source?.invalid && source?.touched ? 'var(--color-validation-error)' : null
                "
              >
                <option value="">Select a repository</option>
                @for (sourceOption of sources(); track sourceOption.name) {
                  <option [value]="sourceOption.name">{{ sourceOption.display_name }}</option>
                }
              </select>
              @if (source?.invalid && source?.touched) {
                <p class="mt-1 text-sm text-[var(--color-text-error)]">
                  Please select a source repository
                </p>
              }
            </div>

            <!-- Repository Preview -->
            @if (selectedSource()) {
              <div
                class="bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-lg p-4"
              >
                <h3 class="font-semibold text-[var(--color-text-primary)] mb-2">
                  Repository Details
                </h3>
                <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
                  <p><span class="font-medium">Name:</span> {{ selectedSource()!.display_name }}</p>
                  @if (selectedSource()!.github_metadata?.repository) {
                    <p>
                      <span class="font-medium">Repository:</span>
                      {{ selectedSource()!.github_metadata?.repository }}
                    </p>
                  }
                  @if (selectedSource()!.github_metadata?.branch) {
                    <p>
                      <span class="font-medium">Branch:</span>
                      {{ selectedSource()!.github_metadata?.branch }}
                    </p>
                  }
                </div>
              </div>
            }
          }

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              (click)="cancel()"
              class="px-4 py-2 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="source?.invalid"
              class="px-4 py-2 bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] disabled:bg-[var(--color-interactive-primary-disabled)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Next →
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Configure -->
      @if (currentStep() === 2) {
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6" [formGroup]="form">
          <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
            Configure Session
          </h2>

          <div class="mb-6">
            <label
              for="prompt"
              class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
            >
              Prompt <span class="text-[var(--color-text-error)]">*</span>
            </label>
            <textarea
              id="prompt"
              formControlName="prompt"
              rows="8"
              class="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
              [style.borderColor]="
                prompt?.invalid && prompt?.touched ? 'var(--color-validation-error)' : null
              "
              placeholder="Describe what you want Jules to do... Be specific about the task, files to modify, and expected outcome."
            ></textarea>
            @if (prompt?.invalid && prompt?.touched) {
              @if (prompt?.errors?.['required']) {
                <p class="mt-1 text-sm text-[var(--color-text-error)]">Prompt is required</p>
              }
              @if (prompt?.errors?.['minlength']) {
                <p class="mt-1 text-sm text-[var(--color-text-error)]">
                  Prompt must be at least 10 characters
                </p>
              }
            }
            <p class="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {{ prompt?.value?.length || 0 }} characters
            </p>
          </div>

          <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                formControlName="automationMode"
                class="w-4 h-4 text-[var(--color-interactive-primary)] border-[var(--color-border-strong)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)] bg-[var(--color-surface-primary)]"
              />
              <span class="text-sm font-medium text-[var(--color-text-secondary)]">
                Automation Mode
              </span>
            </label>
            <p class="mt-1 text-xs text-[var(--color-text-tertiary)] ml-7">
              Allow Jules to execute changes automatically without approval for each step
            </p>
          </div>

          <div class="flex justify-between gap-3 mt-6">
            <button
              type="button"
              (click)="previousStep()"
              class="px-4 py-2 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              ← Previous
            </button>
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="prompt?.invalid"
              class="px-4 py-2 bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] disabled:bg-[var(--color-interactive-primary-disabled)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              Next →
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Review -->
      @if (currentStep() === 3) {
        <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
            Review & Create
          </h2>

          <div class="space-y-4 mb-6">
            <div>
              <h3 class="text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Repository</h3>
              <p class="text-[var(--color-text-primary)]">
                {{ selectedSource()?.display_name || 'Not selected' }}
              </p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Prompt</h3>
              <p class="text-[var(--color-text-primary)] whitespace-pre-wrap">
                {{ form.get('prompt')?.value || 'Not provided' }}
              </p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-[var(--color-text-tertiary)] mb-1">
                Automation Mode
              </h3>
              <p class="text-[var(--color-text-primary)]">
                {{ form.get('automationMode')?.value ? 'Enabled' : 'Disabled' }}
              </p>
            </div>
          </div>

          <!-- Payload Preview -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-[var(--color-text-tertiary)]">Request Payload</h3>
              <button
                type="button"
                (click)="copyPayload()"
                class="text-xs px-2 py-1 rounded border border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)] flex items-center gap-1"
                aria-label="Copy payload to clipboard"
              >
                @if (copiedPayload()) {
                  <span>✓</span> Copied
                } @else {
                  <span>📋</span> Copy
                }
              </button>
            </div>
            <pre
              class="bg-[var(--color-background-tertiary)] border border-[var(--color-border-default)] rounded-lg p-4 text-xs text-[var(--color-text-primary)] overflow-x-auto"
              >{{ getPayloadPreview() }}</pre
            >
          </div>

          <div class="flex justify-between gap-3 mt-6">
            <button
              type="button"
              (click)="previousStep()"
              class="px-4 py-2 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              ← Previous
            </button>
            <button
              type="button"
              (click)="onSubmit()"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 bg-[var(--color-interactive-success)] hover:bg-[var(--color-interactive-success-hover)] disabled:bg-[var(--color-interactive-primary-disabled)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              @if (loading()) {
                <div class="flex items-center gap-2">
                  <app-loading-spinner
                    sizeClass="h-4 w-4"
                    colorClass=""
                    containerClass="p-0"
                    label="Creating session..."
                  ></app-loading-spinner>
                  <span>Creating...</span>
                </div>
              } @else {
                ✓ Create Session
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class SessionCreateComponent {
  private julesService = inject(JulesService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private clipboardService = inject(ClipboardService);

  sources = signal<Source[]>([]);
  loading = signal<boolean>(false);
  loadingSources = signal<boolean>(false);
  error = signal<string | null>(null);
  currentStep = signal<WizardStep>(1);
  copiedPayload = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    source: ['', Validators.required],
    prompt: ['', [Validators.required, Validators.minLength(10)]],
    automationMode: [false],
  });

  selectedSourceId = toSignal(this.form.get('source')!.valueChanges, { initialValue: '' });

  selectedSource = computed(() => {
    const sourceName = this.selectedSourceId();
    if (!sourceName) return null;
    return this.sources().find((s) => s.name === sourceName) || null;
  });

  constructor() {
    this.loadSources();
  }

  loadSources(): void {
    this.loadingSources.set(true);
    this.julesService.getSources().subscribe({
      next: (response) => {
        try {
          const parsed = parseSourcesResponse(response);
          this.sources.set(parsed.sources);
          this.loadingSources.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid sources response.'));
          this.loadingSources.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load sources'));
        this.loadingSources.set(false);
      },
    });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      // Validate current step before proceeding
      if (this.currentStep() === 1 && this.source?.valid) {
        this.currentStep.set(2);
      } else if (this.currentStep() === 2 && this.prompt?.valid) {
        this.currentStep.set(3);
      }
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set((this.currentStep() - 1) as WizardStep);
    }
  }

  getStepCircleClass(step: number): string {
    if (this.currentStep() === step) {
      return 'bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]';
    } else if (this.currentStep() > step) {
      return 'bg-[var(--color-interactive-success)] text-[var(--color-text-inverse)]';
    }
    return 'bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)]';
  }

  getStepLabelClass(step: number): string {
    if (this.currentStep() >= step) {
      return 'text-[var(--color-text-primary)]';
    }
    return 'text-[var(--color-text-tertiary)]';
  }

  getPayloadPreview(): string {
    const payload: CreateSession = {
      prompt: this.form.get('prompt')?.value || '',
      source: this.form.get('source')?.value || '',
    };
    return JSON.stringify(payload, null, 2);
  }

  copyPayload(): void {
    const payload = this.getPayloadPreview();
    this.clipboardService.copyToClipboard(payload).then((success) => {
      if (success) {
        this.copiedPayload.set(true);
        setTimeout(() => this.copiedPayload.set(false), 2000);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading.set(true);
      this.error.set(null);

      const formValue = this.form.value;
      this.julesService
        .createSession({
          prompt: formValue.prompt,
          source: formValue.source,
        })
        .subscribe({
          next: (session) => {
            const id = session.name.split('/').pop() || session.name;
            this.router.navigate(['/jules', id]);
          },
          error: (err: unknown) => {
            this.error.set(getApiErrorMessage(err, 'Failed to create session'));
            this.loading.set(false);
          },
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
