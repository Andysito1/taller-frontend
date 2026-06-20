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
        <h2 class="auth-title">Nueva contrasena</h2>
        <p class="subtitle">El codigo fue validado. Define tu nueva clave para entrar al sistema.</p>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        @if (successMessage()) {
          <div class="status-banner success">{{ successMessage() }}</div>
        }

        <form class="auth-form" [formGroup]="resetForm" (ngSubmit)="submit()" novalidate>
          <div class="form-field password-field">
            <label for="password">Nueva contrasena</label>
            <input id="password" [type]="passwordVisible() ? 'text' : 'password'" formControlName="password" placeholder="Minimo 6 caracteres" autocomplete="new-password" [class.invalid]="password?.invalid && password?.touched">
            <button type="button" class="password-toggle-btn" (click)="togglePasswordVisibility()" aria-label="Mostrar u ocultar contrasena">
              @if (passwordVisible()) { ocultar } @else { mostrar }
            </button>
            @if (password?.hasError('required') && password?.touched) {
              <div class="form-field-error">La contrasena es obligatoria.</div>
            }
            @if (password?.hasError('minlength') && password?.touched) {
              <div class="form-field-error">Debe tener al menos 6 caracteres.</div>
            }
          </div>

          <div class="form-field">
            <label for="password_confirmation">Confirmar contrasena</label>
            <input id="password_confirmation" type="password" formControlName="password_confirmation" placeholder="Repite la nueva contrasena" autocomplete="new-password" [class.invalid]="passwordConfirmation?.invalid && passwordConfirmation?.touched">
            @if (passwordConfirmation?.hasError('required') && passwordConfirmation?.touched) {
              <div class="form-field-error">Confirma la contrasena.</div>
            }
            @if (resetForm.hasError('mismatch') && passwordConfirmation?.touched) {
              <div class="form-field-error">Las contrasenas no coinciden.</div>
            }
          </div>

          <button type="submit" class="primary-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Actualizando...
            } @else {
              Guardar y entrar
            }
          </button>
        </form>

        <div class="auth-footer">
          <p class="footer-note">Correo validado: {{ email() || 'no indicado' }}</p>
          <a routerLink="/recuperar" class="link-secondary">Solicitar otro codigo</a>
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
  public readonly email = signal('');
  public readonly code = signal('');

  public readonly resetForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: this.matchPasswords }
  );

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email')?.trim().toLowerCase() ?? '';
    const code = this.route.snapshot.queryParamMap.get('code')?.trim() ?? '';

    this.email.set(email);
    this.code.set(code);

    if (!email || !code) {
      this.errorMessage.set('Primero valida el codigo enviado a tu correo.');
    }
  }

  get password() {
    return this.resetForm.get('password');
  }

  get passwordConfirmation() {
    return this.resetForm.get('password_confirmation');
  }

  submit(): void {
    if (!this.email() || !this.code()) {
      this.router.navigate(['/recuperar']);
      return;
    }

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const rawValue = this.resetForm.getRawValue();

    this.authService.resetPassword({
      correo: this.email(),
      email: this.email(),
      codigo: this.code(),
      code: this.code(),
      token: this.code(),
      password: rawValue.password,
      password_confirmation: rawValue.password_confirmation,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Contrasena actualizada. Entrando al sistema...');
        this.navigateByRole();
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

  private navigateByRole(): void {
    const role = this.authService.userRole();

    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);
      return;
    }

    if (role === 'MECANICO') {
      this.router.navigate(['/mecanico']);
      return;
    }

    this.router.navigate(['/cliente']);
  }
}
