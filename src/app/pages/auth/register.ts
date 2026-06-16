import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-section">
      <div class="login-card">
        <h2 class="auth-title">Crear Cuenta</h2>
        
        @if (!showVerification()) {
          <!-- Paso 1: Datos de Registro -->
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <div class="form-field">
              <label for="nombre">Nombre Completo</label>
              <input id="nombre" type="text" formControlName="nombre" placeholder="Tu nombre">
            </div>
            <div class="form-field">
              <label for="email">Correo Electrónico</label>
              <input id="email" type="email" formControlName="correo" placeholder="ejemplo@gmail.com">
            </div>
            <div class="form-field">
              <label for="password">Contraseña</label>
              <input id="password" type="password" formControlName="password" placeholder="Mínimo 8 caracteres">
            </div>
            <button type="submit" class="primary-btn" [disabled]="registerForm.invalid || isLoading()">
              {{ isLoading() ? 'Enviando código...' : 'Registrarse' }}
            </button>
          </form>
        } @else {
          <!-- Paso 2: Verificación de Código -->
          <div class="verification-container">
            <p>Hemos enviado un código de 6 dígitos a <strong>{{ registerForm.value.correo }}</strong></p>
            <div class="form-field">
              <input #codeField type="text" maxlength="6" class="code-input" placeholder="000000" aria-label="Código de verificación">
            </div>
            <button (click)="onVerify(codeField.value)" class="primary-btn" [disabled]="isLoading()">
              {{ isLoading() ? 'Verificando...' : 'Verificar e Iniciar Sesión' }}
            </button>
            <button (click)="showVerification.set(false)" class="link-btn">Regresar</button>
          </div>
        }
        
        <div class="auth-footer">
          <a routerLink="/login" class="link-secondary">¿Ya tienes cuenta? Inicia sesión</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './login.component.scss', // Reutilizamos estilos
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public isLoading = signal(false);
  public showVerification = signal(false);

  public registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onRegister() {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showVerification.set(true);
        Swal.fire('Código Enviado', 'Por favor, revisa tu bandeja de entrada en Gmail.', 'info');
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire('Error', err.error?.message || 'No se pudo completar el registro.', 'error');
      }
    });
  }

  onVerify(code: string) {
    if (code.length !== 6) {
      Swal.fire('Atención', 'El código debe tener 6 dígitos.', 'warning');
      return;
    }
    this.isLoading.set(true);
    const email = this.registerForm.value.correo!;

    this.authService.verifyRegistrationCode(email, code).subscribe({
      next: () => {
        Swal.fire('¡Bienvenido!', 'Tu cuenta ha sido verificada con éxito.', 'success');
        this.router.navigate(['/cliente']);
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire('Código Incorrecto', 'El código ingresado no es válido o ha expirado.', 'error');
      }
    });
  }
}