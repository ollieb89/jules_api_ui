import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      // Fallback for older browsers
      return this.fallbackCopyToClipboard(text);
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback to older method
      return this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  private fallbackCopyToClipboard(text: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  }

  /**
   * Read text from clipboard
   * @returns Promise that resolves to clipboard text or null if failed
   */
  async readFromClipboard(): Promise<string | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return null;
    }

    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
      return null;
    }
  }
}
