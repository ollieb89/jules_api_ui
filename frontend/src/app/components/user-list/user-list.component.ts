import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { getApiErrorMessage } from '../../utils/api-error';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

interface FormattedUser extends User {
  formattedDate: string;
}

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, RouterModule, ConfirmationDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);

  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  userToDelete = signal<number | null>(null);

  userToDeleteName = computed(() => {
    const id = this.userToDelete();
    if (!id) return null;
    return this.users().find((u) => u.id === id)?.name || 'this user';
  });

  @ViewChild(ConfirmationDialogComponent) confirmDialog!: ConfirmationDialogComponent;

  formattedUsers = computed<FormattedUser[]>(() => {
    return this.users().map((user) => ({
      ...user,
      formattedDate: new Date(user.created_at).toLocaleDateString(),
    }));
  });

  ngOnInit(): void {
    // Mock data for verification
    this.users.set([
      {
        id: 1,
        name: 'Alice Smith',
        email: 'alice@example.com',
        created_at: '2023-01-01T10:00:00Z',
      },
      { id: 2, name: 'Bob Jones', email: 'bob@example.com', created_at: '2023-01-02T11:00:00Z' },
    ]);
    this.loading.set(false);
    // this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.results);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load users'));
        this.loading.set(false);
      },
    });
  }

  deleteUser(id: number): void {
    if (isPlatformBrowser(this.platformId as object)) {
      this.userToDelete.set(id);
      this.confirmDialog.showModal();
    } else {
      // SSR fallback: proceed with deletion (unlikely to be clicked in SSR, but good practice)
      this.performDelete(id);
    }
  }

  onConfirmDelete(): void {
    const id = this.userToDelete();
    if (id) {
      this.performDelete(id);
    }
  }

  private performDelete(id: number): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        // Optimistic update: remove user from local state immediately
        this.users.update((users) => users.filter((u) => u.id !== id));
        this.confirmDialog?.reset();
        this.userToDelete.set(null);
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Failed to delete user'));
        this.confirmDialog?.reset(); // Ensure dialog closes and resets loading state
      },
    });
  }
}
