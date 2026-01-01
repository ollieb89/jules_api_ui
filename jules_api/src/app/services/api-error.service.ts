import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, normalizeApiError } from '../models/user.model';
import { JulesApiError } from '../models/jules.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  createJulesApiError(error: HttpErrorResponse): JulesApiError {
    let errorMessage = 'An unknown error occurred';
    let fieldErrors: ApiError | null = null;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 400) {
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
    } else if (error.status >= 500) {
      const apiError = error.error as JulesApiError | undefined;
      errorMessage = apiError?.error || 'Server error. Please try again later.';
    } else if (typeof error.error === 'object' && error.error) {
      const apiError = error.error as JulesApiError;
      errorMessage = apiError.error || errorMessage;
    } else {
      errorMessage = `Error: ${error.status} ${error.statusText}`;
    }

    return {
      error: errorMessage,
      fieldErrors: fieldErrors ?? undefined
    };
  }
}
