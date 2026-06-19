import { ServerRoute } from '@angular/ssr';

// IMPORTANTE: Dejar este arreglo VACÍO es la única forma de desactivar el Route Extractor
// que causa el error NG0908 cuando hay librerías incompatibles con Node.js en el build.
export const serverRoutes: ServerRoute[] = [];