import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Acepta cualquier correo con formato válido (Gmail, dominios propios, .pe, .com, etc.) */
export function correoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string) ?? '';
    if (!value) return null;
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value) ? null : { correoInvalido: true };
  };
}

/**
 * Exige el formato correcto de documento según la abreviatura del tipo seleccionado:
 * DNI/RUC/CE solo dígitos (respetando longitud exacta/máxima), Pasaporte alfanumérico.
 */
export function documentoValidator(
  getAbreviatura: () => string,
  getLongitudExacta: () => number | null | undefined,
  getLongitudMaxima: () => number | null | undefined
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string) ?? '';
    if (!value) return null;

    const abreviatura = getAbreviatura();
    const esPasaporte = abreviatura === 'PAS' || abreviatura === 'PASAPORTE';

    if (esPasaporte) {
      return /^[a-zA-Z0-9]+$/.test(value) ? null : { docFormato: 'El pasaporte debe ser un código alfanumérico, sin símbolos ni espacios.' };
    }

    if (!/^[0-9]+$/.test(value)) {
      return { docFormato: `El documento ${abreviatura} solo puede contener dígitos.` };
    }

    const longitudExacta = getLongitudExacta();
    if (longitudExacta && value.length !== longitudExacta) {
      return { docFormato: `El documento ${abreviatura} debe tener ${longitudExacta} dígitos.` };
    }

    const longitudMaxima = getLongitudMaxima();
    if (longitudMaxima && value.length > longitudMaxima) {
      return { docFormato: `El documento ${abreviatura} no puede exceder los ${longitudMaxima} caracteres.` };
    }

    return null;
  };
}
