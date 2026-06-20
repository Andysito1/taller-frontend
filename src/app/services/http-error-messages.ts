import { HttpErrorResponse } from '@angular/common/http';

export type HttpErrorContext = 'login' | 'forgot-password' | 'reset-password' | 'recordatorio-correo';

type ContextMessages = {
  validation: string;
  badRequest: string;
  notFound: string;
  inactive: string;
  server: string;
  generic: string;
};

const MESSAGES: Record<HttpErrorContext, ContextMessages> = {
  login: {
    validation: 'Revisa tu correo y contraseña.',
    badRequest: 'No pudimos iniciar sesión con esos datos.',
    notFound: 'No encontramos una cuenta activa con ese correo.',
    inactive: 'Tu cuenta no está activa. Contacta al administrador.',
    server: 'El servidor no pudo procesar el inicio de sesión.',
    generic: 'No se pudo iniciar sesión. Intenta de nuevo más tarde.',
  },
  'forgot-password': {
    validation: 'Ingresa un correo válido para continuar.',
    badRequest: 'No pudimos procesar la solicitud de recuperación.',
    notFound: 'No encontramos una cuenta activa con ese correo.',
    inactive: 'La cuenta asociada a ese correo no está activa.',
    server: 'No se pudo iniciar la recuperación de contraseña.',
    generic: 'No se pudo solicitar la recuperación. Intenta nuevamente.',
  },
  'reset-password': {
    validation: 'Revisa el código y confirma que las contraseñas coincidan.',
    badRequest: 'No pudimos actualizar la contraseña.',
    notFound: 'El código o el correo ya no son válidos.',
    inactive: 'La cuenta no está activa.',
    server: 'No se pudo restablecer la contraseña.',
    generic: 'No se pudo completar el restablecimiento. Intenta más tarde.',
  },
  'recordatorio-correo': {
    validation: 'Revisa el cliente seleccionado y el mensaje antes de enviar.',
    badRequest: 'No se pudo enviar el recordatorio.',
    notFound: 'El cliente seleccionado no existe o no está disponible.',
    inactive: 'El cliente no está activo para recibir recordatorios.',
    server: 'No se pudo enviar el recordatorio en este momento.',
    generic: 'No se pudo enviar el recordatorio. Intenta más tarde.',
  },
};

export function resolveHttpErrorMessage(error: unknown, context: HttpErrorContext): string {
  const messages = MESSAGES[context];

  if (!(error instanceof HttpErrorResponse)) {
    return messages.generic;
  }

  const backendMessage = extractBackendMessage(error.error);
  const validationMessage = extractValidationMessage(error.error);

  if (error.status === 422) {
    return validationMessage || messages.validation;
  }

  if (error.status === 400) {
    return backendMessage || messages.badRequest;
  }

  if (error.status === 404) {
    return backendMessage || messages.notFound;
  }

  if (error.status === 403) {
    return backendMessage || messages.inactive;
  }

  if (error.status >= 500) {
    return messages.server;
  }

  return backendMessage || messages.generic;
}

function extractBackendMessage(body: unknown): string | null {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    return body.trim() || null;
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    return typeof message === 'string' && message.trim() ? message : null;
  }

  return null;
}

function extractValidationMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const validationErrors = (body as { errors?: Record<string, string[] | string> }).errors;

  if (!validationErrors) {
    return null;
  }

  const messages = Object.values(validationErrors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value).trim())
    .filter(Boolean);

  return messages.length ? messages.join(' ') : null;
}