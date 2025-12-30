import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /**
   * Show a notification message
   */
  show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: this.getPanelClass(type)
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Show a success message
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error message
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show an info message
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a warning message
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Get panel class based on notification type
   */
  private getPanelClass(type: NotificationType): string {
    const classes: Record<NotificationType, string> = {
      success: 'snackbar-success',
      error: 'snackbar-error',
      info: 'snackbar-info',
      warning: 'snackbar-warning'
    };
    return classes[type];
  }
}
