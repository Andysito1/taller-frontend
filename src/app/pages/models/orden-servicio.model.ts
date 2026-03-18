import { Mecanico } from './mecanico.model';
import { Vehiculo } from './vehiculo.model';

export interface OrdenServicio {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  mecanico?: Mecanico;
  vehiculo?: Vehiculo;
}
