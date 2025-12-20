export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string; // ISO 8601 datetime string
}

export interface CreateUser {
  name: string;
  email: string;
}

export interface UpdateUser {
  name?: string;
  email?: string;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface ApiError {
  [field: string]: string[];
}

export interface HttpErrorWithFields extends Error {
  fieldErrors?: ApiError;
}

export interface ValidationErrorResponse {
  [field: string]: string[] | string;
}

/**
 * Type guard to check if an error response is a validation error
 */
export function isValidationErrorResponse(
  error: unknown
): error is ValidationErrorResponse {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  // Check if all values are arrays of strings or strings
  return Object.values(error).every(
    (value) => Array.isArray(value) || typeof value === 'string'
  );
}

/**
 * Type guard to check if an error has field errors
 */
export function hasFieldErrors(error: unknown): error is HttpErrorWithFields {
  return (
    error !== null &&
    typeof error === 'object' &&
    'fieldErrors' in error &&
    typeof (error as HttpErrorWithFields).fieldErrors === 'object'
  );
}

/**
 * Normalize validation error response to ApiError format
 */
export function normalizeApiError(
  error: unknown
): ApiError | null {
  if (!isValidationErrorResponse(error)) {
    return null;
  }

  const normalized: ApiError = {};
  for (const [field, messages] of Object.entries(error)) {
    normalized[field] = Array.isArray(messages) ? messages : [messages];
  }
  return normalized;
}
