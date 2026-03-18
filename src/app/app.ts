import { Component, signal, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly title = signal('Crud_Angular');
  isLoading = true;
  isFading = false;
  isAuthenticated = this.authService.isAuthenticated();
  userName = this.authService.getUserName();
  private authSubscription: Subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    this.authSubscription.add(
      this.authService.getRoleObservable().subscribe((role: string | null) => {
        this.isAuthenticated = !!role;
      })
    );
    this.authSubscription.add(
      this.authService.getUserNameObservable().subscribe((name: string | null) => {
        this.userName = name;
      })
    );

    // Suscribirse para mostrar animación al iniciar sesión
    this.authSubscription.add(
      this.authService.splashSubject.subscribe(() => {
        this.runAnimation();
      })
    );

    // Animación inicial (F5)
    this.runAnimation();
  }

  private runAnimation() {
    this.isLoading = true;
    this.isFading = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.isFading = true; // Inicia el desvanecimiento
      this.cdr.detectChanges(); // Forzar actualización de la vista
      setTimeout(() => {
        this.isLoading = false; // Elimina del DOM después de la transición
        this.cdr.detectChanges(); // Forzar actualización final
      }, 500); // Tiempo que dura el desvanecimiento (0.5s)
    }, 1000); // Tiempo de carga (1s)
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
