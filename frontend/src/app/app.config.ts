import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';
import { julesApiErrorInterceptor } from './interceptors/jules-api-error.interceptor';
import { loggingInterceptor } from './interceptors/logging.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';
import { GlobalErrorHandler } from './services/global-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        julesApiErrorInterceptor,
        loggingInterceptor,
        retryInterceptor
      ])
    ),
    provideMarkdown(),
    provideAnimations(),
    importProvidersFrom(MatDialogModule, MatSnackBarModule)
  ]
};
