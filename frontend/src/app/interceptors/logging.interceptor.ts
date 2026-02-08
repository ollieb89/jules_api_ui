import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.production) {
    return next(req);
  }

  const startedAt = Date.now();
  const redactedUrl = redactSensitiveQueryParams(req.urlWithParams);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - startedAt;
          console.info('[API]', req.method, redactedUrl, `${elapsed}ms`);
        }
      },
      error: (error: HttpErrorResponse) => {
        const elapsed = Date.now() - startedAt;
        console.error('[API]', req.method, redactedUrl, `${elapsed}ms`, error.message);
      },
    }),
  );
};

const SENSITIVE_QUERY_PARAM_PATTERN = /(key|token|secret|password|auth)/i;

const redactSensitiveQueryParams = (url: string): string => {
  try {
    const parsed = new URL(url, 'http://localhost');
    let didRedact = false;
    parsed.searchParams.forEach((value, key) => {
      if (SENSITIVE_QUERY_PARAM_PATTERN.test(key)) {
        parsed.searchParams.set(key, '[redacted]');
        didRedact = true;
      } else if (SENSITIVE_QUERY_PARAM_PATTERN.test(value)) {
        parsed.searchParams.set(key, '[redacted]');
        didRedact = true;
      }
    });

    if (!didRedact) {
      return url;
    }

    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return url.startsWith('http') ? parsed.toString() : path;
  } catch {
    return url;
  }
};
