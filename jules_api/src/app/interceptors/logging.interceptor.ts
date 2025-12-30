import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse
} from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.production) {
    return next(req);
  }

  const startedAt = Date.now();

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - startedAt;
          console.info('[API]', req.method, req.urlWithParams, `${elapsed}ms`);
        }
      },
      error: (error: HttpErrorResponse) => {
        const elapsed = Date.now() - startedAt;
        console.error(
          '[API]',
          req.method,
          req.urlWithParams,
          `${elapsed}ms`,
          error.message
        );
      }
    })
  );
};
