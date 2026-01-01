import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JulesService } from '../../services/jules.service';
import {
  getParserErrorMessage,
  parseSettingsResponse,
  parseTestConnectionResponse,
  parseUpdateApiKeyResponse
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
          class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to Sessions
        </a>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Jules Settings</h1>
        <p class="text-gray-600 dark:text-gray-400">Configure your Jules API key and connection settings</p>
      </div>

      <!-- Connection Status -->
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Connection Status</h2>
        <div class="flex items-center gap-3">
          <div 
            [class]="'w-3 h-3 rounded-full ' + (connectionStatus() === 'connected' ? 'bg-green-500' : connectionStatus() === 'error' ? 'bg-red-500' : 'bg-yellow-500')"
            [title]="getConnectionStatusText()"
          ></div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ getConnectionStatusText() }}
          </span>
        </div>
        @if (settings()) {
          <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            @if (settings()!.api_key_configured) {
              <p>API Key: {{ settings()!.masked_api_key || 'Configured' }}</p>
            } @else {
              <p>No API key configured</p>
            }
          </div>
        }
      </div>

      <!-- API Key Configuration -->
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">API Key Configuration</h2>
        
        @if (error()) {
          <div 
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
            role="alert"
            aria-live="assertive"
          >
            {{ error() }}
          </div>
        }
        
        @if (successMessage()) {
          <div 
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4"
            role="alert"
            aria-live="polite"
          >
            {{ successMessage() }}
          </div>
        }

        <form [formGroup]="apiKeyForm" (ngSubmit)="saveApiKey()">
          <div class="mb-4">
            <label for="api-key" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jules API Key
            </label>
            <input
              id="api-key"
              type="password"
              formControlName="apiKey"
              placeholder="Enter your Jules API key"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="apiKey?.invalid && apiKey?.touched"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your API key is stored securely and never displayed in plaintext.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="apiKeyForm.invalid || saving()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
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
              class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
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
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Resources</h2>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <a
              href="https://jules.google.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
            >
              → Jules Settings Page
            </a>
          </li>
          <li>
            <a
              href="https://jules.google.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
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

  apiKeyForm: FormGroup = this.fb.group({
    apiKey: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    this.loadSettings();
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
      error: (err) => {
        this.error.set(err.message || 'Failed to load settings');
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
        error: (err) => {
          this.error.set(err.message || 'Failed to save API key');
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
      error: (err) => {
        this.error.set(err.message || 'Failed to test connection');
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
