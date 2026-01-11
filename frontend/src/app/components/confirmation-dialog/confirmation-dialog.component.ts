import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <dialog
      #dialog
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-0 backdrop:bg-black/50 min-w-[320px] max-w-lg text-left"
      (cancel)="onCancel($event)"
    >
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ title }}</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ message }}</p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
            (click)="close()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="confirm()"
            [disabled]="loading()"
          >
            @if (loading()) {
              <app-loading-spinner
                sizeClass="h-4 w-4"
                colorClass="text-white"
                containerClass=""
                label="Processing..."
              ></app-loading-spinner>
            }
            <span [attr.aria-hidden]="loading() ? 'true' : null">{{ confirmText }}</span>
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: [`
    dialog {
      border: none;
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      animation: fade-in 0.2s ease-out;
    }
    dialog[open] {
      animation: zoom-in 0.2s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes zoom-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;

  loading = signal(false);

  showModal() {
    this.dialog.nativeElement.showModal();
  }

  close() {
    this.dialog.nativeElement.close();
    this.cancelled.emit();
  }

  onCancel(event: Event) {
    this.cancelled.emit();
  }

  confirm() {
    this.loading.set(true);
    this.confirmed.emit();
  }

  reset() {
    this.loading.set(false);
    this.dialog.nativeElement.close();
  }
}
