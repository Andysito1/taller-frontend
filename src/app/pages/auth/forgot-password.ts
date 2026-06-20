import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-section">
      <div class="auth-overlay"></div>
      <div class="login-card">
        <div class="brand-mark">Xtreme Performance</div>
        <h2 class="auth-title">Recuperar acceso</h2>
        <p class="subtitle">Solicita el código de recuperación para continuar con el restablecimiento.</p>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        <form class="auth-form" [formGroup]="requestForm" (ngSubmit)="requestReset()" novalidate>
          <div class="form-field">
            <label for="correo">Correo electrónico</label>
            <input id="correo" type="email" formControlName="correo" placeholder="tu-correo@gmail.com" autocomplete="email" [class.invalid]="email?.invalid && email?.touched">
            @if (email?.hasError('required') && email?.touched) {
              <div class="form-field-error">El correo es obligatorio.</div>
            }
            @if (email?.hasError('email') && email?.touched) {
              <div class="form-field-error">Ingresa un correo válido.</div>
            }
          </div>

          <button type="submit" class="primary-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Enviando código...
            } @else {
              Enviar instrucciones
            }
          </button>
        </form>

        <div class="auth-footer">
          <p class="footer-note">Si tu cuenta está activa, te guiaremos al restablecimiento después de validar el correo.</p>
          <a routerLink="/login" class="link-secondary">Volver al login</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  public requestForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    if (queryEmail) {
      this.requestForm.patchValue({ correo: queryEmail });
    }
  }

  get email() {
    return this.requestForm.get('correo');
  }

  requestReset() {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const email = this.requestForm.getRawValue().correo.trim().toLowerCase();

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/verificar-codigo'], {
          queryParams: { email },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(resolveHttpErrorMessage(error, 'forgot-password'));
      }
    });
  }
}
