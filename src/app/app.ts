import { Component, signal, OnInit, OnDestroy, inject, ChangeDetectionStrategy, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private pushService = inject(PushNotificationService);
  private platformId = inject(PLATFORM_ID);

  protected readonly title = signal('taller');
  public isLoading = signal(true);
  public isFading = signal(false);
  public isDarkMode = signal(false);
  
  // Conexión directa a los Signals del servicio (limpio y reactivo)
  public isAuthenticated = this.authService.isAuthenticated;
  public userRole = this.authService.userRole;
  public userName = this.authService.userName;

  private authSubscription: Subscription = new Subscription();

  // Lógica para decidir si mostrar la barra de navegación principal
  public showMainNavbar = computed(() => {
    // Ocultamos la barra principal (landing/pública) si el usuario es ADMIN
    return this.userRole() !== 'ADMIN';
  });

  constructor() {}

  ngOnInit(): void {
    // Cargar preferencia de dark mode desde localStorage
    if (isPlatformBrowser(this.platformId)) {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        this.isDarkMode.set(savedDarkMode === 'true');
      } else {
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode.set(prefersDark);
      }
      this.applyTheme(this.isDarkMode());
    }
    
    // Suscribirse para mostrar animación al iniciar sesión
    if (isPlatformBrowser(this.platformId)) {
    
    this.authSubscription.add(
      this.authService.splashSubject.subscribe(() => {
        if (isPlatformBrowser(this.platformId)) {
          this.runAnimation();
        }
      })
    );
    
      this.runAnimation();
      
      // Inicializar push si ya está autenticado
      if (this.isAuthenticated()) {
        this.pushService.initialize();
      }
    }
  }

  private runAnimation() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading.set(true);
    this.isFading.set(false);

    setTimeout(() => {
      this.isFading.set(true); // Inicia el desvanecimiento
      setTimeout(() => {
        this.isLoading.set(false); // Elimina del DOM después de la transición
      }, 500); // Tiempo que dura el desvanecimiento (0.5s)
    }, 1000); // Tiempo de carga (1s)
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  scrollTo(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  toggleDarkMode(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.applyTheme(newValue);
    localStorage.setItem('darkMode', String(newValue));
  }

  private applyTheme(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }
}
