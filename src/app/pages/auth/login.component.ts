import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(7)]]
  });

  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public passwordVisible = signal(false);
  public isLoading = signal(false);

  ngOnInit(): void {
    const resetState = this.route.snapshot.queryParamMap.get('reset');
    if (resetState === 'success') {
      this.successMessage.set('Tu contraseña fue actualizada. Inicia sesión con tu nueva clave.');
    }
  }

  get correo() {
    return this.loginForm.get('correo');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.loginForm.getRawValue();
    const credentials = {
      correo: formValue.correo.trim(),
      password: formValue.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        const user = response.user || response.data;
        const role = user?.rol?.nombre?.toUpperCase();

        if (role === 'CLIENTE') {
          this.router.navigate(['/cliente']);
          return;
        }

        if (role === 'MECANICO') {
          this.router.navigate(['/mecanico']);
          return;
        }

        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
          return;
        }

        this.isLoading.set(false);
        this.errorMessage.set('No pudimos identificar tu rol de acceso.');
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading.set(false);
        this.errorMessage.set(resolveHttpErrorMessage(error, 'login'));
      },
    });
  }

  /**
   * Inicia el flujo de Google OAuth redirigiendo al backend
   */
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }
}
