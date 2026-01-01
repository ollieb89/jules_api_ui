import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  JulesSettings,
  UpdateApiKeyResponse,
  TestConnectionResponse
} from '../models/jules.model';
import { ApiErrorService } from './api-error.service';

@Injectable({ providedIn: 'root' })
export class JulesService {
  private http = inject(HttpClient);
  private apiErrorService = inject(ApiErrorService);
  private readonly apiUrl = `${environment.apiUrl}/jules`;
  private readonly wsUrl = `${environment.wsUrl}/jules`;

  getSessionsEventStreamUrl(params: URLSearchParams): string {
    return `${this.getStreamBaseUrl()}/sessions/cached-events/?${params.toString()}`;
  }

  getSessionEventStreamUrl(sessionId: string, params: URLSearchParams): string {
    return `${this.getStreamBaseUrl()}/sessions/${sessionId}/cached-events/?${params.toString()}`;
  }

  // Sources
  getSources(): Observable<PaginatedSourcesResponse> {
    return this.handleApiError(
      this.http.get<PaginatedSourcesResponse>(`${this.apiUrl}/sources/`)
    );
  }

  // Sessions
  createSession(session: CreateSession): Observable<Session> {
    return this.handleApiError(
      this.http.post<Session>(`${this.apiUrl}/sessions/`, session)
    );
  }

  getSessions(
    pageSize: number = 100,
    pageToken?: string | null
  ): Observable<PaginatedSessionsResponse> {
    let params = new HttpParams().set('page_size', pageSize.toString());
    if (pageToken) {
      params = params.set('page_token', pageToken);
    }
    return this.handleApiError(
      this.http.get<PaginatedSessionsResponse>(`${this.apiUrl}/sessions/`, { params })
    );
  }

  getSession(sessionId: string): Observable<Session> {
    return this.handleApiError(
      this.http.get<Session>(`${this.apiUrl}/sessions/${sessionId}/`)
    );
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.handleApiError(
      this.http.delete<void>(`${this.apiUrl}/sessions/${sessionId}/`)
    );
  }

  approvePlan(sessionId: string): Observable<Session> {
    return this.handleApiError(
      this.http.post<Session>(`${this.apiUrl}/sessions/${sessionId}/approve-plan/`, {})
    );
  }

  sendMessage(sessionId: string, request: SendMessageRequest): Observable<Session> {
    return this.handleApiError(
      this.http.post<Session>(`${this.apiUrl}/sessions/${sessionId}/send-message/`, request)
    );
  }

  // Activities
  getActivities(
    sessionId: string,
    pageSize: number = 100,
    pageToken?: string | null
  ): Observable<PaginatedActivitiesResponse> {
    let params = new HttpParams().set('page_size', pageSize.toString());
    if (pageToken) {
      params = params.set('page_token', pageToken);
    }
    return this.handleApiError(
      this.http.get<PaginatedActivitiesResponse>(
        `${this.apiUrl}/sessions/${sessionId}/activities/`,
        { params }
      )
    );
  }

  // Settings
  getSettings(): Observable<JulesSettings> {
    return this.handleApiError(this.http.get<JulesSettings>(`${this.apiUrl}/settings/`));
  }

  updateApiKey(apiKey: string): Observable<UpdateApiKeyResponse> {
    return this.handleApiError(
      this.http.post<UpdateApiKeyResponse>(
        `${this.apiUrl}/settings/api-key/`,
        { api_key: apiKey }
      )
    );
  }

  testConnection(): Observable<TestConnectionResponse> {
    return this.handleApiError(
      this.http.post<TestConnectionResponse>(`${this.apiUrl}/settings/test/`, {})
    );
  }

  private getStreamBaseUrl(): string {
    return this.toHttpUrl(this.wsUrl);
  }

  private toHttpUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return url.replace(/^ws/, 'http');
  }

  private handleApiError<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((error: unknown) =>
        throwError(() => this.apiErrorService.normalizeError(error))
      )
    );
  }
}
