import { HttpErrorResponse } from '@angular/common/http';
import { resolveHttpErrorMessage } from './http-error-messages';

describe('resolveHttpErrorMessage', () => {
  it('prefers validation errors for 422 responses', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { errors: { correo: ['El correo es obligatorio.'] } },
    });

    expect(resolveHttpErrorMessage(error, 'forgot-password')).toContain('correo');
  });

  it('returns a friendly message for 404 responses', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: {},
    });

    expect(resolveHttpErrorMessage(error, 'login')).toBe('No encontramos una cuenta activa con ese correo.');
  });

  it('returns server message for 500 responses', () => {
    const error = new HttpErrorResponse({ status: 500 });

    expect(resolveHttpErrorMessage(error, 'recordatorio-correo')).toBe('No se pudo enviar el recordatorio en este momento.');
  });
});