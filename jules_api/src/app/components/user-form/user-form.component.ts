import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/user.service';
import { JulesApiError } from '../../models/jules.model';
import { ApiError, hasFieldErrors } from '../../models/user.model';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  userForm: FormGroup;
  isEditMode = signal<boolean>(false);
  userId = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  fieldErrors = signal<ApiError | null>(null);

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.userId.set(Number(id));
      this.loadUser(Number(id));
    }
  }

  loadUser(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUser(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          name: user.name,
          email: user.email
        });
        this.loading.set(false);
      },
      error: (err: JulesApiError) => {
        this.error.set(getApiErrorMessage(err, 'Failed to load user'));
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      // Focus first invalid field
      this.focusFirstInvalidField();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.fieldErrors.set(null);

    const formValue = this.userForm.value;

    const operation = this.isEditMode()
      ? this.userService.updateUser(this.userId()!, formValue)
      : this.userService.createUser(formValue);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err: JulesApiError) => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(err, 'Failed to save user'));
        
        // Handle field-specific errors if available
        if (hasFieldErrors(err)) {
          this.fieldErrors.set(err.fieldErrors);
          // Set field-specific errors on form controls
          Object.keys(err.fieldErrors).forEach((field) => {
            const control = this.userForm.get(field);
            if (control) {
              control.setErrors({ serverError: err.fieldErrors[field][0] });
              control.markAsTouched();
            }
          });
          // Focus first field with error
          this.focusFirstInvalidField();
        }
      }
    });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidKey = this.getFirstInvalidControlKey();
    if (firstInvalidKey) {
      const element = document.querySelector(`[formControlName="${firstInvalidKey}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }
  }

  private getFirstInvalidControlKey(): string | null {
    // First, check for touched invalid controls
    for (const key of Object.keys(this.userForm.controls)) {
      const control = this.userForm.get(key);
      if (control && control.invalid && control.touched) {
        return key;
      }
    }
    // If no touched invalid control, find first invalid and mark as touched
    for (const key of Object.keys(this.userForm.controls)) {
      const control = this.userForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
        return key;
      }
    }
    return null;
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  getFieldError(fieldName: string): string | null {
    const control = this.userForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['serverError']) {
        return control.errors['serverError'];
      }
    }
    return null;
  }
}
