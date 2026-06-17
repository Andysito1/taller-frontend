import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas públicas que sí queremos generar estáticamente
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'registro', renderMode: RenderMode.Prerender },
  { path: 'recuperar', renderMode: RenderMode.Prerender },
  
  // Rutas protegidas: NO se pueden prerenderizar porque requieren Auth/Roles
  { path: 'admin', renderMode: RenderMode.Server },
  { path: 'admin/**', renderMode: RenderMode.Server },
  { path: 'cliente', renderMode: RenderMode.Server },
  { path: 'mecanico', renderMode: RenderMode.Server },
  
  // Por defecto, cualquier otra ruta se maneja en el servidor
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
