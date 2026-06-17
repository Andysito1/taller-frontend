import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

export const PublicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) return true;
  
  const role = authService.userRole();
  router.navigate([role ? `/${role.toLowerCase()}` : '/']);
  return false;
};

export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const userRole = authService.userRole();
  const expectedPath = route.routeConfig?.path?.toUpperCase();

  if (userRole && expectedPath && userRole === expectedPath) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
