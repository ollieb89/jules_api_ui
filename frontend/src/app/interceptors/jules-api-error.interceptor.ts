import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from '../services/api-error.service';
import { JulesApiError } from '../models/jules.model';

export const julesApiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const normalizedError: JulesApiError = apiErrorService.normalizeError(error);
      console.error('API error:', normalizedError.error, error);
      return throwError(() => normalizedError);
    }),
  );
};
