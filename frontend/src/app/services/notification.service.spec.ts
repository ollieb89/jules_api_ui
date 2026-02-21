import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';
import { vi } from 'vitest';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSnackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [NotificationService, { provide: MatSnackBar, useValue: mockSnackBar }],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    service.success('Success message');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Success message',
      'Close',
      expect.objectContaining({
        duration: 3000,
        panelClass: 'snackbar-success',
      }),
    );
  });

  it('should show error notification', () => {
    service.error('Error message');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Error message',
      'Close',
      expect.objectContaining({
        duration: 5000,
        panelClass: 'snackbar-error',
      }),
    );
  });

  it('should show info notification', () => {
    service.info('Info message');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Info message',
      'Close',
      expect.objectContaining({
        duration: 3000,
        panelClass: 'snackbar-info',
      }),
    );
  });

  it('should show warning notification', () => {
    service.warning('Warning message');
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Warning message',
      'Close',
      expect.objectContaining({
        duration: 4000,
        panelClass: 'snackbar-warning',
      }),
    );
  });
});
