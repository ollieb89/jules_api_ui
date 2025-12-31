import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
import { getApiErrorMessage } from '../utils/api-error';

@Injectable({ providedIn: 'root' })
export class JulesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/jules`;

  getErrorMessage(error: unknown, fallback: string): string {
    return getApiErrorMessage(error, fallback);
  }

  // Sources
  getSources(): Observable<PaginatedSourcesResponse> {
    return this.http.get<PaginatedSourcesResponse>(`${this.apiUrl}/sources/`);
  }

  // Sessions
  createSession(session: CreateSession): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/sessions/`, session);
  }

  getSessions(
    pageSize: number = 100,
    pageToken?: string | null
  ): Observable<PaginatedSessionsResponse> {
    let params = new HttpParams().set('page_size', pageSize.toString());
    if (pageToken) {
      params = params.set('page_token', pageToken);
    }
    return this.http.get<PaginatedSessionsResponse>(`${this.apiUrl}/sessions/`, { params });
  }

  getSession(sessionId: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/sessions/${sessionId}/`);
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${sessionId}/`);
  }

  approvePlan(sessionId: string): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/sessions/${sessionId}/approve-plan/`, {});
  }

  sendMessage(sessionId: string, request: SendMessageRequest): Observable<Session> {
    return this.http.post<Session>(
      `${this.apiUrl}/sessions/${sessionId}/send-message/`,
      request
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
    return this.http.get<PaginatedActivitiesResponse>(
      `${this.apiUrl}/sessions/${sessionId}/activities/`,
      { params }
    );
  }

  // Settings
  getSettings(): Observable<JulesSettings> {
    return this.http.get<JulesSettings>(`${this.apiUrl}/settings/`);
  }

  updateApiKey(apiKey: string): Observable<UpdateApiKeyResponse> {
    return this.http.post<UpdateApiKeyResponse>(
      `${this.apiUrl}/settings/api-key/`,
      { api_key: apiKey }
    );
  }

  testConnection(): Observable<TestConnectionResponse> {
    return this.http.post<TestConnectionResponse>(
      `${this.apiUrl}/settings/test/`,
      {}
    );
  }
}
