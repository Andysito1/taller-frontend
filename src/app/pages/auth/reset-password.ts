import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-section">
      <div class="auth-overlay"></div>
      <div class="login-card">
        <div class="brand-mark">Xtreme Performance</div>
        <h2 class="auth-title">Restablecer contraseña</h2>
        <p class="subtitle">Ingresa el código o token recibido por correo y define una nueva clave segura.</p>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="status-banner success">{{ successMessage() }}</div>
        }

        <form class="auth-form" [formGroup]="resetForm" (ngSubmit)="submit()" novalidate>
          <div class="form-field">
            <label for="correo">Correo electrónico</label>
            <input id="correo" type="email" formControlName="correo" placeholder="tu-correo@gmail.com" autocomplete="email" [class.invalid]="correo?.invalid && correo?.touched">
            @if (correo?.hasError('required') && correo?.touched) {
              <div class="form-field-error">El correo es obligatorio.</div>
            }
            @if (correo?.hasError('email') && correo?.touched) {
              <div class="form-field-error">Ingresa un correo válido.</div>
            }
          </div>

          <div class="form-field">
            <label for="code">Código o token de verificación</label>
            <input id="code" type="text" formControlName="code" placeholder="123456 o token del enlace" autocomplete="one-time-code" [class.invalid]="code?.invalid && code?.touched">
            @if (code?.hasError('required') && code?.touched) {
              <div class="form-field-error">El código o token es obligatorio.</div>
            }
            @if (code?.hasError('minlength') && code?.touched) {
              <div class="form-field-error">Debe tener al menos 6 caracteres.</div>
            }
          </div>

          <div class="form-field password-field">
            <label for="password">Nueva contraseña</label>
            <input id="password" [type]="passwordVisible() ? 'text' : 'password'" formControlName="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" [class.invalid]="password?.invalid && password?.touched">
            <button type="button" class="password-toggle-btn" (click)="togglePasswordVisibility()" aria-label="Mostrar u ocultar contraseña">
              @if (passwordVisible()) { ocultar } @else { mostrar }
            </button>
            @if (password?.hasError('required') && password?.touched) {
              <div class="form-field-error">La contraseña es obligatoria.</div>
            }
            @if (password?.hasError('minlength') && password?.touched) {
              <div class="form-field-error">Debe tener al menos 8 caracteres.</div>
            }
          </div>

          <div class="form-field">
            <label for="password_confirmation">Confirmar contraseña</label>
            <input id="password_confirmation" type="password" formControlName="password_confirmation" placeholder="Repite la nueva contraseña" autocomplete="new-password" [class.invalid]="passwordConfirmation?.invalid && passwordConfirmation?.touched">
            @if (passwordConfirmation?.hasError('required') && passwordConfirmation?.touched) {
              <div class="form-field-error">Confirma la contraseña.</div>
            }
            @if (resetForm.hasError('mismatch') && passwordConfirmation?.touched) {
              <div class="form-field-error">Las contraseñas no coinciden.</div>
            }
          </div>

          <button type="submit" class="primary-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Actualizando clave...
            } @else {
              Restablecer contraseña
            }
          </button>
        </form>

        <div class="auth-footer">
          <p class="footer-note">Si el código expiró, vuelve a solicitar recuperación desde el login.</p>
          <a routerLink="/login" class="link-secondary">Volver al login</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly matchPasswords: ValidatorFn = (group) => {
    const password = group.get('password')?.value;
    const confirmation = group.get('password_confirmation')?.value;

    if (!password || !confirmation) {
      return null;
    }

    return password === confirmation ? null : { mismatch: true };
  };

  public readonly isLoading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  public readonly passwordVisible = signal(false);

  public readonly resetForm = this.fb.nonNullable.group(
    {
      correo: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: this.matchPasswords }
  );

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const code = this.route.snapshot.queryParamMap.get('code') || this.route.snapshot.queryParamMap.get('token');

    if (email) {
      this.resetForm.patchValue({ correo: email });
    }

    if (code) {
      this.resetForm.patchValue({ code });
    }
  }

  get correo() {
    return this.resetForm.get('correo');
  }

  get code() {
    return this.resetForm.get('code');
  }

  get password() {
    return this.resetForm.get('password');
  }

  get passwordConfirmation() {
    return this.resetForm.get('password_confirmation');
  }

  submit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const rawValue = this.resetForm.getRawValue();
    const correo = rawValue.correo.trim().toLowerCase();
    const payload = {
      correo,
      email: correo,
      code: rawValue.code.trim(),
      token: rawValue.code.trim(),
      password: rawValue.password,
      password_confirmation: rawValue.password_confirmation,
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Tu contraseña se actualizó correctamente. Redirigiendo al login...');
        this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(resolveHttpErrorMessage(error, 'reset-password'));
      },
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
