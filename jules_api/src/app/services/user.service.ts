import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  User,
  CreateUser,
  UpdateUser,
  UserListResponse,
  ApiError,
  HttpErrorWithFields,
  normalizeApiError
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  createUser(user: CreateUser): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, user: UpdateUser): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/`, user).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    let fieldErrors: ApiError | null = null;
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 400) {
        // Validation errors from Django
        fieldErrors = normalizeApiError(error.error);
        if (fieldErrors) {
          const errorMessages = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          errorMessage = `Validation error: ${errorMessages}`;
        } else {
          errorMessage = 'Invalid request data';
        }
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Error: ${error.status} ${error.statusText}`;
      }
    }

    console.error('UserService error:', errorMessage, error);
    
    // Create error object with message and fieldErrors
    const customError = new Error(errorMessage) as HttpErrorWithFields;
    if (fieldErrors) {
      customError.fieldErrors = fieldErrors;
    }
    
    return throwError(() => customError);
  };

  extractFieldErrors(error: HttpErrorResponse): ApiError | null {
    if (error.status === 400 && error.error) {
      return normalizeApiError(error.error);
    }
    return null;
  }
}
