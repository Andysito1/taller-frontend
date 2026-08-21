import { TipoDocumento } from './tipo-documento.model';

export type EstadoSolicitudReserva = 'pendiente' | 'atendida' | 'rechazada';

export interface SolicitudReserva {
  id: number;
  id_tipo_documento: number;
  tipo_documento?: TipoDocumento;
  numero_documento: string;
  correo: string;
  telefono: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio: number;
  problema: string;
  estado: EstadoSolicitudReserva;
  motivo_rechazo?: string | null;
  created_at: string;
  updated_at: string;
}
