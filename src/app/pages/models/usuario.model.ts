export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  avatar?: string;
  id_rol: number;
  rol: Rol;
  activo: boolean;

  telefono?: string;
    numero_documento?: string;
    tipo_documento?: {
        id: number;
        nombre: string;
        abreviatura: string;
    };
  direccion?: string;
}
