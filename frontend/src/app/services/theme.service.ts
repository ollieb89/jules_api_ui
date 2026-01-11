import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'jules-theme-mode';
  
  // Current theme mode preference (light, dark, or system)
  private readonly mode = signal<ThemeMode>(this.loadStoredMode());
  
  // Computed effective theme (light or dark, resolved from system preference if mode is 'system')
  readonly theme = signal<'light' | 'dark'>(this.resolveTheme(this.mode()));
  
  constructor() {
    // Watch for system preference changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.mode() === 'system') {
          this.theme.set(this.resolveTheme('system'));
        }
      });
      
      // Persist theme changes to localStorage
      effect(() => {
        const currentMode = this.mode();
        const effectiveTheme = this.theme();
        
        localStorage.setItem(this.STORAGE_KEY, currentMode);
        this.applyTheme(effectiveTheme);
      });
    }
  }
  
  /**
   * Get current theme mode preference
   */
  getMode(): ThemeMode {
    return this.mode();
  }
  
  /**
   * Get current effective theme (light or dark)
   */
  getTheme(): 'light' | 'dark' {
    return this.theme();
  }
  
  /**
   * Set theme mode (light, dark, or system)
   */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.theme.set(this.resolveTheme(mode));
  }
  
  /**
   * Toggle between light and dark (ignores system preference)
   */
  toggle(): void {
    const currentTheme = this.theme();
    this.setMode(currentTheme === 'light' ? 'dark' : 'light');
  }
  
  /**
   * Load stored theme mode from localStorage, defaulting to 'system'
   */
  private loadStoredMode(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'system';
    }
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  }
  
  /**
   * Resolve effective theme from mode preference
   */
  private resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'system') {
      if (typeof window === 'undefined') {
        return 'light';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }
  
  /**
   * Apply theme class to HTML element
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') {
      return;
    }
    
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}

