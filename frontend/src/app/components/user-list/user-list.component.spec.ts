import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../services/user.service';

// Mock HTMLDialogElement for JSDOM
if (typeof window !== 'undefined' && !window.HTMLDialogElement) {
  // @ts-ignore
  window.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
    showModal = vi.fn();
    close = vi.fn();
  };
} else if (typeof window !== 'undefined') {
    // If it exists but methods are missing (common in some jsdom versions)
    if (!HTMLElement.prototype.hasOwnProperty('showModal')) {
         // @ts-ignore
        HTMLDialogElement.prototype.showModal = vi.fn();
    }
    if (!HTMLElement.prototype.hasOwnProperty('close')) {
         // @ts-ignore
        HTMLDialogElement.prototype.close = vi.fn();
    }
}

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: any;

  beforeEach(async () => {
    userService = {
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

    // Polyfill dialog methods on the element instance if needed
    // This is because Angular might bind to the element before we patched the prototype or JSDOM behavior
    const dialogEl = fixture.nativeElement.querySelector('dialog');
    if (dialogEl) {
        if (!dialogEl.showModal) dialogEl.showModal = vi.fn();
        if (!dialogEl.close) dialogEl.close = vi.fn();
    }
  });

  it('renders the seeded users in the table', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('navigates to the create user route', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.createUser();

    expect(navigateSpy).toHaveBeenCalledWith(['/users/new']);
  });

  it('optimistically removes user from list on delete confirmation', () => {
    // Initial state: 2 users
    expect(component.users().length).toBe(2);

    // Select user to delete
    component.userToDelete.set(1);

    // Simulate confirmation
    component.onConfirmDelete();

    // Should call service
    expect(userService.deleteUser).toHaveBeenCalledWith(1);

    // Should NOT call loadUsers (mocked getUsers)
    // We check this by seeing if getUsers was called again.
    expect(userService.getUsers).not.toHaveBeenCalled();

    // Should remove user from local signal
    expect(component.users().length).toBe(1);
    expect(component.users()[0].id).toBe(2);
  });
});
