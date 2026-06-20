import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

@Component({
  selector: 'app-verify-reset-code',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-section">
      <div class="auth-overlay"></div>
      <div class="login-card">
        <div class="brand-mark">Xtreme Performance</div>
        <h2 class="auth-title">Verificar codigo</h2>
        <p class="subtitle">Ingresa solo el codigo de 6 digitos que enviamos a tu correo.</p>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }

        <form class="auth-form" [formGroup]="codeForm" (ngSubmit)="verifyCode()" novalidate>
          <div class="form-field">
            <label for="codigo">Codigo de recuperacion</label>
            <input id="codigo" type="text" inputmode="numeric" maxlength="6" formControlName="codigo" placeholder="123456" autocomplete="one-time-code" [class.invalid]="codigo?.invalid && codigo?.touched">
            @if (codigo?.hasError('required') && codigo?.touched) {
              <div class="form-field-error">El codigo es obligatorio.</div>
            }
            @if ((codigo?.hasError('minlength') || codigo?.hasError('maxlength')) && codigo?.touched) {
              <div class="form-field-error">El codigo debe tener 6 digitos.</div>
            }
          </div>

          <button type="submit" class="primary-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Verificando...
            } @else {
              Verificar codigo
            }
          </button>
        </form>

        <div class="auth-footer">
          <p class="footer-note">Correo: {{ email() || 'no indicado' }}</p>
          <a routerLink="/recuperar" class="link-secondary">Solicitar otro codigo</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyResetCodeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly isLoading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly email = signal('');

  public readonly codeForm = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email')?.trim().toLowerCase() ?? '';
    this.email.set(email);

    if (!email) {
      this.errorMessage.set('Primero ingresa tu correo para recibir un codigo.');
    }
  }

  get codigo() {
    return this.codeForm.get('codigo');
  }

  verifyCode(): void {
    if (!this.email()) {
      this.router.navigate(['/recuperar']);
      return;
    }

    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const code = this.codeForm.getRawValue().codigo.trim();

    this.authService.verifyPasswordResetCode(this.email(), code).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/restablecer'], {
          queryParams: { email: this.email(), code },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(resolveHttpErrorMessage(error, 'reset-password'));
      },
    });
  }
}
