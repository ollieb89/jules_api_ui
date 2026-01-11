import { HttpErrorResponse } from '@angular/common/http';

import { JulesApiError } from '../models/jules.model';

const getErrorPayload = (error: unknown): JulesApiError | null => {
  if (error instanceof HttpErrorResponse) {
    return typeof error.error === 'object' ? (error.error as JulesApiError) : null;
  }
  if (error && typeof error === 'object' && 'error' in error) {
    return error as JulesApiError;
  }
  return null;
};

export const getRetryAfterSeconds = (error: unknown): number | null => {
  const payload = getErrorPayload(error);
  if (payload && typeof payload.retry_after_seconds === 'number') {
    return payload.retry_after_seconds;
  }
  return null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const payload = getErrorPayload(error);
  if (payload) {
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error;
    }
    if (payload.error && typeof payload.error === 'object' && payload.error.message) {
      return payload.error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
