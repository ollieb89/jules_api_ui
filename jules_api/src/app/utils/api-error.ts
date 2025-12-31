import { JulesApiError } from '../models/jules.model';

const isJulesApiError = (error: unknown): error is JulesApiError => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (!('error' in error)) {
    return false;
  }

  const value = (error as { error: unknown }).error;
  return typeof value === 'string';
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isJulesApiError(error) && error.error.trim().length > 0) {
    return error.error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
