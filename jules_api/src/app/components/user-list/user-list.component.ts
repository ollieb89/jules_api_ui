import { Component, OnInit, signal, ChangeDetectionStrategy, inject, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

interface FormattedUser extends User {
  formattedDate: string;
}

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  formattedUsers = computed<FormattedUser[]>(() => {
    return this.users().map(user => ({
      ...user,
      formattedDate: new Date(user.created_at).toLocaleDateString()
    }));
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load users');
        this.loading.set(false);
      }
    });
  }

  deleteUser(id: number): void {
    if (isPlatformBrowser(this.platformId as object)) {
      if (confirm('Are you sure you want to delete this user?')) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.loadUsers(); // Reload the list
          },
          error: (err) => {
            this.error.set(err.message || 'Failed to delete user');
          }
        });
      }
    } else {
      // SSR fallback: proceed with deletion
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers(); // Reload the list
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete user');
        }
      });
    }
  }

  createUser(): void {
    this.router.navigate(['/users/new']);
  }

  editUser(id: number): void {
    this.router.navigate(['/users', id, 'edit']);
  }
}