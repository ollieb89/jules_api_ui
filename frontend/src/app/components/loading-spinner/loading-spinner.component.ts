import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex justify-center items-center"
      [class]="containerClass"
      role="status"
      [attr.aria-label]="label"
    >
      <svg
        class="animate-spin"
        [class]="sizeClass + ' ' + colorClass"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="sr-only">{{ label }}</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() sizeClass = 'h-8 w-8';
  @Input() colorClass = 'text-blue-600 dark:text-blue-400';
  @Input() containerClass = 'py-4';
  @Input() label = 'Loading...';
}
