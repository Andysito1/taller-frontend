import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-google-callback',
  template: `<div class="loading-overlay"><p>Finalizando autenticación...</p></div>`,
  styles: [`.loading-overlay { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.2rem; }`]
})
export class GoogleCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Laravel suele redirigir como: /auth/callback?token=XYZ
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.authService.handleAuthCallback(token).subscribe({
        next: (user) => {
          Swal.fire({
            icon: 'success',
            title: `¡Bienvenido, ${this.authService.currentUser()?.nombre}!`,
            text: 'Has iniciado sesión correctamente.',
            timer: 2500,
            showConfirmButton: false
          });
          
          // Redirección basada en rol
          const role = this.authService.userRole();
          if (role === 'ADMIN') this.router.navigate(['/admin/ordenes']);
          else if (role === 'MECANICO') this.router.navigate(['/mecanico']);
          else this.router.navigate(['/cliente']);
        },
        error: () => {
          Swal.fire('Error', 'No se pudo sincronizar la información del usuario.', 'error');
          this.router.navigate(['/login']);
        }
      });
    } else {
      Swal.fire('Error', 'No se recibió un token de acceso válido.', 'error');
      this.router.navigate(['/login']);
    }
  }
}