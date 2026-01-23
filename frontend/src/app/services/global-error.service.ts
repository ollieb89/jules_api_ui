import { Injectable, signal } from '@angular/core';

export type GlobalErrorState = {
  message: string;
  timestamp: number;
};

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly errorState = signal<GlobalErrorState | null>(null);

  readonly error = this.errorState.asReadonly();

  setError(message: string): void {
    this.errorState.set({
      message,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.errorState.set(null);
  }
}
