import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import { getApiErrorMessage } from '../../utils/api-error';
import {
  parseSettingsResponse,
  parseUpdateApiKeyResponse,
  parseTestConnectionResponse,
  getParserErrorMessage
} from '../../utils/api-parsers';

interface SettingsResponse {
  api_key_configured: boolean;
  masked_api_key?: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="mb-6">
        <a
          routerLink="/jules"
          class="text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] mb-4 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
        >
          ← Back to Sessions
        </a>
        <h1 class="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Jules Settings</h1>
        <p class="text-[var(--color-text-secondary)]">Configure your Jules API key and connection settings</p>
      </div>

      <!-- Connection Status -->
      <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Connection Status</h2>
        <div class="flex items-center gap-3">
          <div 
            [class]="'w-3 h-3 rounded-full ' + (connectionStatus() === 'connected' ? 'bg-[var(--color-state-success)]' : connectionStatus() === 'error' ? 'bg-[var(--color-state-error)]' : 'bg-[var(--color-state-warning)]')"
            [title]="getConnectionStatusText()"
          ></div>
          <span class="text-sm font-medium text-[var(--color-text-secondary)]">
            {{ getConnectionStatusText() }}
          </span>
        </div>
        @if (settings()) {
          <div class="mt-4 text-sm text-[var(--color-text-secondary)]">
            @if (settings()!.api_key_configured) {
              <p>API Key: {{ settings()!.masked_api_key || 'Configured' }}</p>
            } @else {
              <p>No API key configured</p>
            }
          </div>
        }
      </div>

      <!-- API Key Configuration -->
      <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">API Key Configuration</h2>
        
        @if (error()) {
          <div 
            class="bg-[var(--color-surface-error)] border border-[var(--color-border-error)] text-[var(--color-text-error)] px-4 py-3 rounded mb-4"
            role="alert"
            aria-live="assertive"
          >
            {{ error() }}
          </div>
        }
        
        @if (successMessage()) {
          <div 
            class="bg-[var(--color-surface-success)] border border-[var(--color-border-success)] text-[var(--color-text-success)] px-4 py-3 rounded mb-4"
            role="alert"
            aria-live="polite"
          >
            {{ successMessage() }}
          </div>
        }

        <form [formGroup]="apiKeyForm" (ngSubmit)="saveApiKey()">
          <div class="mb-4">
            <label for="api-key" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Jules API Key
            </label>
            <div class="relative">
              <input
                id="api-key"
                [type]="showApiKey() ? 'text' : 'password'"
                formControlName="apiKey"
                placeholder="Enter your Jules API key"
                class="w-full pl-3 pr-10 py-2 border border-[var(--color-border-strong)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
                [style.borderColor]="apiKey?.invalid && apiKey?.touched ? 'var(--color-validation-error)' : null"
              />
              <button
                type="button"
                (click)="toggleApiKeyVisibility()"
                [attr.aria-label]="showApiKey() ? 'Hide API key' : 'Show API key'"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-background-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
              >
                @if (showApiKey()) {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              </button>
            </div>
            <p class="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Your API key is stored securely and never displayed in plaintext.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="apiKeyForm.invalid || saving()"
              class="px-4 py-2 bg-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary-hover)] disabled:bg-[var(--color-interactive-primary-disabled)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              @if (saving()) {
                Saving...
              } @else {
                Save API Key
              }
            </button>
            <button
              type="button"
              (click)="testConnection()"
              [disabled]="testing() || !settings()?.api_key_configured"
              class="px-4 py-2 bg-[var(--color-interactive-success)] hover:bg-[var(--color-interactive-success-hover)] disabled:bg-[var(--color-interactive-primary-disabled)] text-[var(--color-text-inverse)] font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              @if (testing()) {
                Testing...
              } @else {
                Test Connection
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Additional Resources -->
      <div class="bg-[var(--color-surface-primary)] shadow-md rounded-lg p-6">
        <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Resources</h2>
        <ul class="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>
            <a
              href="https://jules.google.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              → Jules Settings Page
            </a>
          </li>
          <li>
            <a
              href="https://jules.google.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-interactive-primary)] hover:text-[var(--color-interactive-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)]"
            >
              → Documentation
            </a>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private julesService = inject(JulesService);
  private fb = inject(FormBuilder);

  settings = signal<SettingsResponse | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  testing = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  connectionStatus = signal<'connected' | 'error' | 'unknown'>('unknown');
  showApiKey = signal<boolean>(false);

  apiKeyForm: FormGroup = this.fb.group({
    apiKey: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey.update((v) => !v);
  }

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    // Note: This endpoint needs to be added to JulesService
    this.julesService.getSettings().subscribe({
      next: (response) => {
        try {
          const parsed = parseSettingsResponse(response);
          this.settings.set(parsed);
          this.updateConnectionStatus(parsed.api_key_configured);
          this.loading.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid settings response.'));
          this.loading.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load settings'));
        this.loading.set(false);
      }
    });
  }

  saveApiKey(): void {
    if (this.apiKeyForm.valid) {
      this.saving.set(true);
      this.error.set(null);
      this.successMessage.set(null);

      const apiKey = this.apiKeyForm.get('apiKey')?.value;
      this.julesService.updateApiKey(apiKey).subscribe({
        next: (response) => {
          try {
            const parsed = parseUpdateApiKeyResponse(response);
            this.successMessage.set(parsed.message || 'API key saved successfully');
            this.apiKeyForm.reset();
            this.loadSettings();
            this.saving.set(false);
          } catch (error) {
            this.error.set(getParserErrorMessage(error, 'Invalid update response.'));
            this.saving.set(false);
          }
        },
        error: (err: unknown) => {
          this.error.set(getApiErrorMessage(err, 'Failed to save API key'));
          this.saving.set(false);
        }
      });
    }
  }

  testConnection(): void {
    this.testing.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.julesService.testConnection().subscribe({
      next: (response) => {
        try {
          const parsed = parseTestConnectionResponse(response);
          if (parsed.status === 'success') {
            this.successMessage.set(parsed.message || 'Connection successful!');
            this.connectionStatus.set('connected');
          } else {
            this.error.set(parsed.message || 'Connection failed');
            this.connectionStatus.set('error');
          }
          this.testing.set(false);
        } catch (error) {
          this.error.set(getParserErrorMessage(error, 'Invalid test response.'));
          this.connectionStatus.set('error');
          this.testing.set(false);
        }
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to test connection'));
        this.connectionStatus.set('error');
        this.testing.set(false);
      }
    });
  }

  updateConnectionStatus(configured: boolean): void {
    if (configured) {
      this.connectionStatus.set('unknown');
    } else {
      this.connectionStatus.set('error');
    }
  }

  getConnectionStatusText(): string {
    switch (this.connectionStatus()) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Not Connected';
      default:
        return 'Unknown';
    }
  }

  get apiKey() {
    return this.apiKeyForm.get('apiKey');
  }
}
