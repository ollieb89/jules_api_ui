import { ErrorHandler, Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NotificationService } from './notification.service';
import { GlobalErrorService } from './global-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalErrorService = inject(GlobalErrorService);

  handleError(error: unknown): void {
    const message =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.';

    console.error('Unhandled application error:', error);
    if (isPlatformBrowser(this.platformId)) {
      const notifications = this.injector.get(NotificationService);
      notifications.error(message);
    }
    this.globalErrorService.setError(message);
  }
}
