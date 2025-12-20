import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Source,
  Session,
  CreateSession,
  Activity,
  SendMessageRequest,
  PaginatedSourcesResponse,
  PaginatedSessionsResponse,
  PaginatedActivitiesResponse,
  JulesApiError
} from '../models/jules.model';
import {
  ApiError,
  HttpErrorWithFields,
  normalizeApiError
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class JulesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/jules`;

  // Sources
  getSources(): Observable<PaginatedSourcesResponse> {
    return this.http.get<PaginatedSourcesResponse>(`${this.apiUrl}/sources/`).pipe(
      catchError(this.handleError)
    );
  }

  // Sessions
  createSession(session: CreateSession): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/sessions/`, session).pipe(
      catchError(this.handleError)
    );
  }

  getSessions(pageSize: number = 100, pageToken?: string | null): Observable<PaginatedSessionsResponse> {
    let params = new HttpParams().set('page_size', pageSize.toString());
    if (pageToken) {
      params = params.set('page_token', pageToken);
    }
    return this.http.get<PaginatedSessionsResponse>(`${this.apiUrl}/sessions/`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getSession(sessionId: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/sessions/${sessionId}/`).pipe(
      catchError(this.handleError)
    );
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${sessionId}/`).pipe(
      catchError(this.handleError)
    );
  }

  approvePlan(sessionId: string): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/sessions/${sessionId}/approve-plan/`, {}).pipe(
      catchError(this.handleError)
    );
  }

  sendMessage(sessionId: string, request: SendMessageRequest): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/sessions/${sessionId}/send-message/`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Activities
  getActivities(sessionId: string, pageSize: number = 100, pageToken?: string | null): Observable<PaginatedActivitiesResponse> {
    let params = new HttpParams().set('page_size', pageSize.toString());
    if (pageToken) {
      params = params.set('page_token', pageToken);
    }
    return this.http.get<PaginatedActivitiesResponse>(`${this.apiUrl}/sessions/${sessionId}/activities/`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    let fieldErrors: ApiError | null = null;
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 400) {
        // Validation errors from Django
        fieldErrors = normalizeApiError(error.error);
        if (fieldErrors) {
          const errorMessages = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          errorMessage = `Validation error: ${errorMessages}`;
        } else {
          errorMessage = 'Invalid request data';
        }
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 500) {
        const apiError = error.error as JulesApiError;
        errorMessage = apiError?.error || 'Server error. Please try again later.';
      } else {
        errorMessage = `Error: ${error.status} ${error.statusText}`;
      }
    }

    console.error('JulesService error:', errorMessage, error);
    
    // Create error object with message and fieldErrors
    const customError = new Error(errorMessage) as HttpErrorWithFields;
    if (fieldErrors) {
      customError.fieldErrors = fieldErrors;
    }
    
    return throwError(() => customError);
  };

  extractFieldErrors(error: HttpErrorResponse): ApiError | null {
    if (error.status === 400 && error.error) {
      return normalizeApiError(error.error);
    }
    return null;
  }
}

