import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-section">
      <div class="login-card">
        <h2 class="auth-title">Recuperar Acceso</h2>
        
        @if (step() === 1) {
          <p class="subtitle">Ingresa tu correo para recibir un código de recuperación.</p>
          <div class="form-field">
            <input #emailInput type="email" placeholder="tu-correo@gmail.com" class="auth-input">
          </div>
          <button (click)="requestLink(emailInput.value)" class="primary-btn" [disabled]="isLoading()">
            {{ isLoading() ? 'Enviando...' : 'Enviar Código' }}
          </button>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="onReset()">
            <p class="subtitle">Ingresa el código y tu nueva contraseña.</p>
            <div class="form-field">
              <input type="text" formControlName="code" placeholder="Código de 6 dígitos">
            </div>
            <div class="form-field">
              <input type="password" formControlName="password" placeholder="Nueva contraseña">
            </div>
            <div class="form-field">
              <input type="password" formControlName="password_confirmation" placeholder="Repite la contraseña">
            </div>
            <button type="submit" class="primary-btn" [disabled]="resetForm.invalid || isLoading()">
              {{ isLoading() ? 'Actualizando...' : 'Cambiar Contraseña' }}
            </button>
          </form>
        }
        
        <div class="auth-footer">
          <a routerLink="/login" class="link-secondary">Volver al login</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public step = signal(1);
  public isLoading = signal(false);
  public userEmail = '';

  public resetForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: any) {
    return g.get('password').value === g.get('password_confirmation').value ? null : { mismatch: true };
  }

  requestLink(email: string) {
    if (!email.includes('@')) return;
    this.isLoading.set(true);
    this.userEmail = email;

    this.authService.sendPasswordResetCode(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set(2);
        Swal.fire('Código Enviado', 'Revisa tu Gmail para obtener el código de recuperación.', 'success');
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Error', 'No encontramos un usuario con ese correo.', 'error');
      }
    });
  }

  onReset() {
    if (this.resetForm.invalid) return;
    this.isLoading.set(true);

    const data = {
      email: this.userEmail,
      ...this.resetForm.value
    };

    this.authService.resetPassword(data).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire('Error', err.error?.message || 'El código es inválido o expiró.', 'error');
      }
    });
  }
}