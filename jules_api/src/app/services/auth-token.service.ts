import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'jules_api_token';
  private cachedToken: string | null = null;
  private hasLoadedFromStorage = false;

  getToken(): string | null {
    if (!this.hasLoadedFromStorage && isPlatformBrowser(this.platformId)) {
      this.cachedToken = sessionStorage.getItem(this.storageKey);
      this.hasLoadedFromStorage = true;
    }

    return this.cachedToken;
  }

  setToken(token: string | null): void {
    this.cachedToken = token;
    this.hasLoadedFromStorage = true;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (token) {
      sessionStorage.setItem(this.storageKey, token);
    } else {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  clearToken(): void {
    this.setToken(null);
  }
}
