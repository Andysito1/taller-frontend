import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'clientes',
    loadComponent: () => import('./clientes').then((m) => m.Clientes),
  },
  {
    path: 'mecanicos',
    loadComponent: () => import('./mecanicos').then((m) => m.Mecanicos),
  },
  {
    path: 'vehiculos',
    loadComponent: () => import('./vehiculos').then((m) => m.Vehiculos),
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios').then((m) => m.Usuarios),
  },
  {
    path: 'ordenes',
    loadComponent: () => import('./ordenes').then((m) => m.Ordenes),
  },
  {
    path: 'reportes',
    loadComponent: () => import('./reportes').then((m) => m.Reportes),
  },
  {
    path: '',
    redirectTo: 'clientes',
    pathMatch: 'full',
  },
];