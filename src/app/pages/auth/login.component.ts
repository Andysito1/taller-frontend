import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './auth.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  passwordVisible = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7)]]
    });
  }

  get correo() {
    return this.loginForm.get('correo');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;
      const credentials = {
        correo: formValue.correo,
        password: formValue.password
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
              this.errorMessage = 'Rol de usuario no reconocido. No se puede redirigir.';
              return;
          }
          this.router.navigate([path]);
        },
        error: (error) => {
          console.error('Error en login:', error);
          if (error.status === 422 && error.error?.errors) {
            // Manejo específico para errores de validación de Laravel (422)
            const validationErrors = Object.values(error.error.errors).flat().join(' ');
            this.errorMessage = validationErrors || 'Error de validación.';
          } else if (error.error?.message) {
            // Captura el mensaje específico del backend para errores 401, etc.
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'No se pudo iniciar sesión. Verifique sus credenciales o intente más tarde.';
          }
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }
}
