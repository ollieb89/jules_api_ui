import { JulesApiError } from '../models/jules.model';

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as JulesApiError;
    if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
      return apiError.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
