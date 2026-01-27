import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserFormComponent } from './user-form.component';
import { UserService } from '../../services/user.service';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    const userService = {
      getUser: vi.fn(() => of({ id: 1, name: 'Test User', email: 'test@example.com' })),
      createUser: vi.fn(() => of({}))
    };

    await TestBed.configureTestingModule({
      imports: [UserFormComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: UserService, useValue: userService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns required field errors when controls are touched', () => {
    component.userForm.controls['name'].markAsTouched();
    component.userForm.controls['email'].markAsTouched();

    expect(component.getFieldError('name')).toBe('Name is required');
    expect(component.getFieldError('email')).toBe('Email is required');
  });

  it('renders a "Cancel" link pointing to /users', () => {
    const cancelLink = fixture.nativeElement.querySelector('a[href="/users"]');
    expect(cancelLink).toBeTruthy();
    expect(cancelLink.textContent).toContain('Cancel');
  });
});
