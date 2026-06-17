import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

// --- MOCK GLOBAL PARA DETENER EL ERROR DE RUTAS NG0908 ---
if (typeof window === 'undefined') {
  const noop = () => {};
  const mockStorage = {
    getItem: () => null,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: () => null,
    length: 0
  };

  (global as any).window = {
    location: { href: '', origin: '', pathname: '/' },
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true
  };
  (global as any).localStorage = mockStorage;
  (global as any).sessionStorage = mockStorage;
  (global as any).document = {
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}
// --------------------------------------------------------

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;