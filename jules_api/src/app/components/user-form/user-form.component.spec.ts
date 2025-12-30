import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserFormComponent } from './user-form.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let mockUserService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockUserService = {
      getUser: (id: number) => of({ id, name: 'Test User', email: 'test@example.com' }),
      createUser: () => of({}),
      updateUser: () => of({}),
    };

    mockRouter = {
      navigate: () => {},
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [UserFormComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have required indicators on labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('label');
    let nameLabelWithAsterisk = false;
    let emailLabelWithAsterisk = false;

    labels.forEach((label: HTMLElement) => {
      const text = label.textContent || '';
      if (text.includes('Name') && label.querySelector('.text-red-500')) {
        nameLabelWithAsterisk = true;
      }
      if (text.includes('Email') && label.querySelector('.text-red-500')) {
        emailLabelWithAsterisk = true;
      }
    });

    expect(nameLabelWithAsterisk).toBe(true);
    expect(emailLabelWithAsterisk).toBe(true);
  });

  it('should have placeholders on inputs', () => {
    const nameInput = fixture.nativeElement.querySelector('#name');
    const emailInput = fixture.nativeElement.querySelector('#email');

    expect(nameInput.getAttribute('placeholder')).toBe('Enter user name');
    expect(emailInput.getAttribute('placeholder')).toBe('Enter user email');
  });

  it('should have autofocus on name input', () => {
    const nameInput = fixture.nativeElement.querySelector('#name');
    expect(nameInput.hasAttribute('autofocus')).toBe(true);
  });

  it('should show spinner when loading', () => {
    component.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('svg.animate-spin');
    expect(spinner).toBeTruthy();
    expect(spinner.getAttribute('aria-hidden')).toBe('true');

    const buttonText = fixture.nativeElement.querySelector('button[type="submit"]').textContent;
    expect(buttonText).toContain('Saving...');
  });
});
