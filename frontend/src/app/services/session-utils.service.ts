import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionUtilsService {
  /**
   * Extract session ID from session name
   * Handles both full session paths (e.g., "projects/123/sessions/456") and plain IDs
   * @param sessionName The session name or ID
   * @returns The extracted session ID
   */
  extractSessionId(sessionName: string): string {
    if (!sessionName) {
      return sessionName;
    }

    const parts = sessionName.split('/').filter(Boolean);
    if (parts.length === 0) {
      return sessionName;
    }

    return parts[parts.length - 1];
  }
}
