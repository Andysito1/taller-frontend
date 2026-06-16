import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <main class="login-page">
      <section class="login-card" role="region" aria-labelledby="login-title">
        <header>
          <h1 id="login-title">Bienvenido al Taller</h1>
          <p>Gestione sus vehículos y servicios de forma sencilla.</p>
        </header>

        <button 
          (click)="login()" 
          class="btn-google" 
          aria-label="Iniciar sesión con su cuenta de Google"
        >
          <img src="assets/icons/google.svg" alt="" aria-hidden="true">
          <span>Iniciar sesión con Google</span>
        </button>
      </section>
    </main>
  `,
  styles: [`
    .login-page { display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #f8f9fa; }
    .login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; width: 90%; }
    h1 { margin-bottom: 0.5rem; color: #1a1a1a; }
    p { color: #666; margin-bottom: 2rem; }
    .btn-google { 
      display: flex; align-items: center; justify-content: center; gap: 10px; 
      width: 100%; padding: 0.8rem; border: 1px solid #dadce0; border-radius: 6px;
      background: white; cursor: pointer; font-weight: 500; transition: background 0.3s;
    }
    .btn-google:hover { background: #f1f3f4; }
    .btn-google img { width: 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private authService = inject(AuthService);

  login(): void {
    this.authService.loginWithGoogle();
  }
}