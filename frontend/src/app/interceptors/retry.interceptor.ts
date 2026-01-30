import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, timer, throwError } from 'rxjs';

import { getRetryAfterSeconds } from '../utils/api-error';

const MAX_RETRY_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 300;
const MAX_BACKOFF_MS = 2000;

const shouldRetry = (error: HttpErrorResponse): boolean => {
  if (error.status === 0) {
    return true;
  }

  return [429, 502, 503, 504].includes(error.status);
};

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const isIdempotent = req.method === 'GET' || req.method === 'HEAD';

  if (!isIdempotent) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRY_ATTEMPTS,
      delay: (error, retryCount) => {
        if (!(error instanceof HttpErrorResponse) || !shouldRetry(error)) {
          return throwError(() => error);
        }
        const retryAfterSeconds = getRetryAfterSeconds(error);
        if (retryAfterSeconds && retryAfterSeconds > 0) {
          return timer(retryAfterSeconds * 1000);
        }
        const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (retryCount - 1), MAX_BACKOFF_MS);
        return timer(backoff);
      },
    }),
  );
};
