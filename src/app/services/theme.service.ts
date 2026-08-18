import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public isDarkMode = signal(this.checkInitialDarkMode());

  private checkInitialDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.applyTheme(newValue);
    localStorage.setItem('darkMode', newValue.toString());
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  }
}
