import { Component, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import { Source, CreateSession } from '../../models/jules.model';
import { getParserErrorMessage, parseSourcesResponse } from '../../utils/api-parsers';

type WizardStep = 1 | 2 | 3;

@Component({
  selector: 'app-session-create',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Session</h1>
        <p class="text-gray-600 dark:text-gray-400">Start a new coding session with Jules AI agent</p>
      </div>

      <!-- Step Indicator -->
      <nav aria-label="Progress" class="mb-8">
        <ol class="flex items-center justify-between">
          @for (step of [1, 2, 3]; track step) {
            <li class="flex items-center flex-1" [attr.aria-current]="currentStep() === step ? 'step' : null">
              <div class="flex flex-col items-center">
                <div 
                  [class]="'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ' + getStepCircleClass(step)"
                  aria-hidden="true"
                >
                  @if (currentStep() > step) {
                    ✓
                  } @else {
                    {{ step }}
                  }
                </div>
                <span 
                  [class]="'mt-2 text-xs font-medium ' + getStepLabelClass(step)"
                >
                  <span class="sr-only">Step {{ step }}: </span>
                  @switch (step) {
                    @case (1) { Select Source }
                    @case (2) { Configure }
                    @case (3) { Review }
                  }
                </span>
              </div>
              @if (step < 3) {
                <div 
                  [class]="'flex-1 h-0.5 mx-4 ' + (currentStep() > step ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600')"
                  aria-hidden="true"
                ></div>
              }
            </li>
          }
        </ol>
      </nav>

      @if (error()) {
        <div 
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
          role="alert"
          aria-live="assertive"
        >
          {{ error() }}
        </div>
      }

      <!-- Step 1: Select Source -->
      @if (currentStep() === 1) {
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6" [formGroup]="form">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Select GitHub Repository</h2>
          
          @if (loadingSources()) {
            <div class="text-gray-600 dark:text-gray-400">Loading repositories...</div>
          } @else if (sources().length === 0) {
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-4">
              No repositories found. Please configure your GitHub connection.
            </div>
          } @else {
            <div class="mb-6">
              <label for="source" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository <span class="text-red-500">*</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">({{ sources().length }} available)</span>
              </label>
              <select
                id="source"
                formControlName="source"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style="color-scheme: light dark;"
                [class.border-red-500]="source?.invalid && source?.touched"
              >
                <option value="">Select a repository</option>
                @for (sourceOption of sources(); track sourceOption.name) {
                  <option [value]="sourceOption.name">{{ sourceOption.display_name }}</option>
                }
              </select>
              @if (source?.invalid && source?.touched) {
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">Please select a source repository</p>
              }
            </div>

            <!-- Repository Preview -->
            @if (selectedSource()) {
              <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Repository Details</h3>
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><span class="font-medium">Name:</span> {{ selectedSource()!.display_name }}</p>
                  @if (selectedSource()!.github_metadata?.repository) {
                    <p><span class="font-medium">Repository:</span> {{ selectedSource()!.github_metadata?.repository }}</p>
                  }
                  @if (selectedSource()!.github_metadata?.branch) {
                    <p><span class="font-medium">Branch:</span> {{ selectedSource()!.github_metadata?.branch }}</p>
                  }
                </div>
              </div>
            }
          }

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              (click)="cancel()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="source?.invalid"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Configure -->
      @if (currentStep() === 2) {
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6" [formGroup]="form">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Configure Session</h2>
          
          <div class="mb-6">
            <label for="prompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt <span class="text-red-500">*</span>
            </label>
            <textarea
              id="prompt"
              formControlName="prompt"
              rows="8"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="prompt?.invalid && prompt?.touched"
              placeholder="Describe what you want Jules to do... Be specific about the task, files to modify, and expected outcome."
            ></textarea>
            @if (prompt?.invalid && prompt?.touched) {
              @if (prompt?.errors?.['required']) {
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">Prompt is required</p>
              }
              @if (prompt?.errors?.['minlength']) {
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">Prompt must be at least 10 characters</p>
              }
            }
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ prompt?.value?.length || 0 }} characters</p>
          </div>

          <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                formControlName="automationMode"
                class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Automation Mode
              </span>
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
              Allow Jules to execute changes automatically without approval for each step
            </p>
          </div>

          <div class="flex justify-between gap-3 mt-6">
            <button
              type="button"
              (click)="previousStep()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="prompt?.invalid"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Review -->
      @if (currentStep() === 3) {
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Review & Create</h2>
          
          <div class="space-y-4 mb-6">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Repository</h3>
              <p class="text-gray-900 dark:text-gray-100">{{ selectedSource()?.display_name || 'Not selected' }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Prompt</h3>
              <p class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{{ form.get('prompt')?.value || 'Not provided' }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Automation Mode</h3>
              <p class="text-gray-900 dark:text-gray-100">{{ form.get('automationMode')?.value ? 'Enabled' : 'Disabled' }}</p>
            </div>
          </div>

          <!-- Payload Preview -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Request Payload</h3>
            <pre class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">{{ getPayloadPreview() }}</pre>
          </div>

          <div class="flex justify-between gap-3 mt-6">
            <button
              type="button"
              (click)="previousStep()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              (click)="onSubmit()"
              [disabled]="form.invalid || loading()"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              @if (loading()) {
                Creating...
              } @else {
                ✓ Create Session
              }
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class SessionCreateComponent {
  private julesService = inject(JulesService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  sources = signal<Source[]>([]);
  loading = signal<boolean>(false);
  loadingSources = signal<boolean>(false);
  error = signal<string | null>(null);
  currentStep = signal<WizardStep>(1);

  form: FormGroup = this.fb.group({
    source: ['', Validators.required],
    prompt: ['', [Validators.required, Validators.minLength(10)]],
    automationMode: [false]
  });

  selectedSource = computed(() => {
    const sourceName = this.form.get('source')?.value;
    if (!sourceName) return null;
    return this.sources().find(s => s.name === sourceName) || null;
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
      error: (err) => {
        console.error('Error loading sources:', err);
        this.error.set(err.message || 'Failed to load sources');
        this.loadingSources.set(false);
      }
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
      return 'bg-blue-600 dark:bg-blue-500 text-white';
    } else if (this.currentStep() > step) {
      return 'bg-green-600 dark:bg-green-500 text-white';
    }
    return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }

  getStepLabelClass(step: number): string {
    if (this.currentStep() >= step) {
      return 'text-gray-900 dark:text-gray-100';
    }
    return 'text-gray-500 dark:text-gray-400';
  }

  getPayloadPreview(): string {
    const payload: CreateSession = {
      prompt: this.form.get('prompt')?.value || '',
      source: this.form.get('source')?.value || ''
    };
    return JSON.stringify(payload, null, 2);
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
