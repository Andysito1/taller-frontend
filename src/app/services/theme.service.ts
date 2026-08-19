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
    // Activa el modo oscuro nativo de Bootstrap 5.3: sin esto, componentes
    // como .card, .table, .modal o .form-select siguen usando sus propias
    // variables --bs-* (fondo blanco fijo) sin importar nuestras variables
    // de tema, que solo cubren markup propio (no el de Bootstrap).
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  }
}
