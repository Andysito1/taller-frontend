import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDarkToggleComponent } from '../../shared/components/button-dark-toggle/button-dark-toggle-component';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonDarkToggleComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  private authService = inject(AuthService);
  
  public isDarkMode = signal(this.checkInitialDarkMode());

  private checkInitialDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }

  public toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.applyTheme(newValue);
    localStorage.setItem('darkMode', newValue.toString());
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
