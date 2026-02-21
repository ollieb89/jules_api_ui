import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../services/user.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeAll(() => {
    // Polyfill HTMLDialogElement methods for JSDOM
    if (typeof HTMLDialogElement !== 'undefined') {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    }
  });

  beforeEach(async () => {
    const userService = {
      getUsers: vi.fn(() =>
        of({
          results: [
            { id: 1, name: 'Alice Smith', email: 'alice@example.com', created_at: '2023-01-01T10:00:00Z' },
            { id: 2, name: 'Bob Jones', email: 'bob@example.com', created_at: '2023-01-02T11:00:00Z' }
          ]
        })
      ),
      deleteUser: vi.fn(() => of({}))
    };

    await TestBed.configureTestingModule({
      imports: [UserListComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the seeded users in the table', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('renders "Add User" link with correct routerLink', () => {
    const link = fixture.nativeElement.querySelector('a[aria-label="Add new user"]');
    expect(link).toBeTruthy();
    // Angular's RouterTestingModule should update the href property
    expect(link.getAttribute('href')).toBe('/users/new');
  });

  it('renders "Edit" links with correct routerLink', () => {
    const editLinks = fixture.nativeElement.querySelectorAll('a[aria-label^="Edit user"]');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].getAttribute('href')).toBe('/users/1/edit');
    expect(editLinks[1].getAttribute('href')).toBe('/users/2/edit');
  });

  it('optimistically removes user from list upon deletion without reloading', () => {
    const userService = TestBed.inject(UserService);

    // Initial state check
    expect(component.users().length).toBe(2);

    // Setup user to delete
    const userToDelete = component.users().find(u => u.id === 1)!;
    component.userToDelete.set(userToDelete);

    // Execute confirmation
    component.onConfirmDelete();

    // Verify API call
    expect(userService.deleteUser).toHaveBeenCalledWith(1);

    // Verify optimistic update (list reduced to 1)
    expect(component.users().length).toBe(1);
    expect(component.users()[0].id).toBe(2);

    // Verify NO reload happened
    expect(userService.getUsers).not.toHaveBeenCalled();
  });

  it('updates confirmation message with user name', () => {
    const user = component.users()[0];
    component.deleteUser(user);
    fixture.detectChanges();

    const expectedMessage = `Are you sure you want to delete ${user.name}? This action cannot be undone.`;
    expect(component.deleteMessage()).toBe(expectedMessage);
  });
});
