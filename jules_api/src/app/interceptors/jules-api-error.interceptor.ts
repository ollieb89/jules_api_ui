import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from '../services/api-error.service';

export const julesApiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const normalizedError = apiErrorService.createJulesApiError(error);
        console.error('API error:', normalizedError.error, error);
        return throwError(() => normalizedError);
      }

      return throwError(() => error);
    })
  );
};
