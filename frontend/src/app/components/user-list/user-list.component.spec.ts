import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../services/user.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    const userService = {
      getUsers: vi.fn(() =>
        of({
          results: [
            {
              id: 1,
              name: 'Alice Smith',
              email: 'alice@example.com',
              created_at: '2023-01-01T10:00:00Z',
            },
            {
              id: 2,
              name: 'Bob Jones',
              email: 'bob@example.com',
              created_at: '2023-01-02T11:00:00Z',
            },
          ],
        }),
      ),
      deleteUser: vi.fn(() => of({})),
    };

    await TestBed.configureTestingModule({
      imports: [UserListComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
});
