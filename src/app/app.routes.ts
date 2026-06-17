import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login.component';
import { AuthGuard, PublicGuard, RoleGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/auth/register').then(m => m.Register),
    canActivate: [PublicGuard]
  },
  {
    path: 'recuperar',
    loadComponent: () => import('./pages/auth/forgot-password').then(m => m.ForgotPassword),
    canActivate: [PublicGuard]
  },
  {
    path: 'cliente',
    loadComponent: () => import('./pages/cliente/cliente').then(m => m.Cliente),
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'mecanico',
    loadComponent: () => import('./pages/mecanico/mecanico').then(m => m.Mecanico),
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.Admin),
    canActivate: [AuthGuard, RoleGuard],
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./pages/admin/clientes').then(m => m.Clientes)
      },
      {
        path: 'mecanicos',
        loadComponent: () => import('./pages/admin/mecanicos').then(m => m.Mecanicos)
      },
      {
        path: 'vehiculos',
        loadComponent: () => import('./pages/admin/vehiculos').then(m => m.Vehiculos)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios').then(m => m.Usuarios)
      },
      {
        path: 'ordenes',
        loadComponent: () => import('./pages/admin/ordenes').then(m => m.Ordenes)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/admin/reportes').then(m => m.Reportes)
      },
      { path: '', redirectTo: 'clientes', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
