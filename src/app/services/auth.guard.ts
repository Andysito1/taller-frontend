import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// 1. Guard para rutas protegidas (Solo usuarios logueados)
export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// 2. Guard para rutas públicas (Login, Home - Si ya está logueado, lo redirige)
export const PublicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Si ya está logueado, redirigir a una página interna segura (ej: cliente o administrador)
  const role = authService.userRole();
  if (role === 'ADMIN' || role === 'MECANICO') {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/cliente']);
  }
  return false;
};

// 3. Guard para roles específicos (Verifica si tiene permisos para entrar a la ruta)
export const RoleGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.userRole();
  
  // Si el usuario es ADMIN o MECANICO, permitimos el acceso a las rutas compartidas de administración
  if (role === 'ADMIN' || role === 'MECANICO') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
