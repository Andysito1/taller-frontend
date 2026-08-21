import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AdminService } from '../../services/admin.service';
import { ButtonDarkToggleComponent } from '../../shared/components/button-dark-toggle/button-dark-toggle-component';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonDarkToggleComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  public isDarkMode = this.themeService.isDarkMode;
  public solicitudesPendientesCount = signal(0);

  ngOnInit(): void {
    this.adminService.getSolicitudesPendientesCount().subscribe({
      next: (res) => this.solicitudesPendientesCount.set(res.count ?? 0),
      error: (err) => console.error('Error al consultar solicitudes pendientes:', err),
    });
  }

  public toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  irASolicitudes(): void {
    this.solicitudesPendientesCount.set(0);
    this.router.navigate(['/admin/solicitudes']);
  }

  logout(): void {
    this.authService.logout();
  }
}