import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  
  // Si está compilando en el servidor, saltamos el Guard para que no se cuelgue el build
  if (!isPlatformBrowser(platformId) || typeof window === 'undefined') return true;

  const authService = inject(AuthService);
  return authService.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

export const PublicGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  
  // Si está compilando en el servidor, saltamos el Guard
  if (!isPlatformBrowser(platformId)) return true;

  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) return true;
  
  const role = authService.userRole();
  router.navigate([role ? `/${role.toLowerCase()}` : '/']);
  return false;
};

export const RoleGuard: CanActivateFn = (route) => {
  const platformId = inject(PLATFORM_ID);
  
  // Si está compilando en el servidor, saltamos el Guard
  if (!isPlatformBrowser(platformId)) return true;

  const authService = inject(AuthService);
  const userRole = authService.userRole();
  const expectedPath = route.routeConfig?.path?.toUpperCase();

  if (userRole && expectedPath && userRole === expectedPath) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};