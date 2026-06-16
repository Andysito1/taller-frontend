import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(7)]]
  });

  public errorMessage = signal<string | null>(null);
  public passwordVisible = signal(false);
  public isLoading = signal(false);

  get correo() {
    return this.loginForm.get('correo');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      const formValue = this.loginForm.value;
      const credentials = {
        correo: formValue.correo!,
        password: formValue.password!
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          const role = response.user?.rol?.nombre?.toUpperCase();
          let path: string;
          switch (role) {
            case 'CLIENTE':
              path = '/cliente';
              break;
            case 'MECANICO':
              path = '/mecanico';
              break;
            case 'ADMIN':
              path = '/admin';
              break;
            default:
              this.errorMessage.set('Rol de usuario no reconocido. No se puede redirigir.');
              this.isLoading.set(false);
              return;
          }
          this.router.navigate([path]);
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.isLoading.set(false);
          if (error.status === 422 && error.error?.errors) {
            // Manejo específico para errores de validación de Laravel (422)
            const validationErrors = Object.values(error.error.errors).flat().join(' ');
            this.errorMessage.set(validationErrors || 'Error de validación.');
          } else if (error.error?.message) {
            // Captura el mensaje específico del backend para errores 401, etc.
            this.errorMessage.set(error.error.message);
          } else {
            this.errorMessage.set('No se pudo iniciar sesión. Verifique sus credenciales o intente más tarde.');
          }
        }
      });
    }
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
