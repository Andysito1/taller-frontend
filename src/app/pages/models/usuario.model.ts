import { Role } from './role.model';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  id_rol: number;
  activo: boolean;
  telefono: string | null;
  direccion: string | null;
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PAS' | null;
  numero_documento: string | null;
  rol: Role;
}

