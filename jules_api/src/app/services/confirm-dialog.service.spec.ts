import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogService } from './confirm-dialog.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { vi } from 'vitest';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockDialogRef: { afterClosed: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDialogRef = {
      afterClosed: vi.fn()
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef)
    };

    TestBed.configureTestingModule({
      providers: [
        ConfirmDialogService,
        { provide: MatDialog, useValue: mockDialog }
      ]
    });

    service = TestBed.inject(ConfirmDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open confirmation dialog with correct data', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    service.confirm('Test Title', 'Test Message', 'Yes', 'No').subscribe();

    expect(mockDialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({
        width: '400px',
        data: {
          title: 'Test Title',
          message: 'Test Message',
          confirmText: 'Yes',
          cancelText: 'No'
        }
      })
    );
  });

  it('should return true when confirmed', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    service.confirm('Title', 'Message').subscribe(result => {
      expect(result).toBe(true);
    });
  });

  it('should return false when cancelled', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(false));

    service.confirm('Title', 'Message').subscribe(result => {
      expect(result).toBe(false);
    });
  });

  it('should return false when dialog is dismissed without result', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(undefined));

    service.confirm('Title', 'Message').subscribe(result => {
      expect(result).toBe(false);
    });
  });

  it('should use default button texts', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    service.confirm('Title', 'Message').subscribe();

    expect(mockDialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          confirmText: 'Confirm',
          cancelText: 'Cancel'
        })
      })
    );
  });
});

