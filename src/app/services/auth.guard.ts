import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  canActivate(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      // Permitir en SSR para que el cliente pueda hidratar y verificar el localStorage después
      return true;
    }

    // Usar el método getRole() del servicio que ya maneja la lectura del storage
    const role = this.authService.getRole()?.toUpperCase(); 
    const targetRoute = state.url;

    console.log(`RoleGuard Check: Rol=${role}, Ruta=${targetRoute}`);

    if (!role) {
      this.router.navigate(['/login']);
      return false;
    }

    // Lógica de roles más flexible
    if (role === 'CLIENTE') {
      // Permitir rutas que empiecen por /cliente O rutas específicas como /mis-vehiculos
      if (targetRoute.startsWith('/cliente') || targetRoute.startsWith('/mis-vehiculos')) {
        return true;
      }
    } else if (role === 'MECANICO' && targetRoute.startsWith('/mecanico')) {
      return true;
    } else if (role === 'ADMIN' && targetRoute.startsWith('/admin')) {
      return true;
    }

    // Si no coincide, redirigir
    console.warn('Acceso denegado por RoleGuard');
    this.router.navigate(['/login']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  canActivate(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.authService.isAuthenticated()) {
      const role = this.authService.getRole()?.toUpperCase();

      if (role === 'CLIENTE') {
        this.router.navigate(['/cliente']);
        return false;
      } else if (role === 'MECANICO') {
        this.router.navigate(['/mecanico']);
        return false;
      } else if (role === 'ADMIN') {
        this.router.navigate(['/admin']);
        return false;
      }
    }
    return true;
  }
}
