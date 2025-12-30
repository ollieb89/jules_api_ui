import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  /**
   * Open a confirmation dialog
   * @param title Dialog title
   * @param message Dialog message
   * @param confirmText Text for confirm button (default: 'Confirm')
   * @param cancelText Text for cancel button (default: 'Cancel')
   * @returns Observable that emits true if confirmed, false if cancelled
   */
  confirm(
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '400px',
        data: {
          title,
          message,
          confirmText,
          cancelText
        }
      }
    );

    return new Observable<boolean>(observer => {
      dialogRef.afterClosed().subscribe({
        next: (result) => {
          observer.next(result ?? false);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}
