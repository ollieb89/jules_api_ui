import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from '../services/api-error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const normalizedError = apiErrorService.createHttpError(error);
      console.error('API error:', normalizedError.message, error);
      return throwError(() => normalizedError);
    })
  );
};
