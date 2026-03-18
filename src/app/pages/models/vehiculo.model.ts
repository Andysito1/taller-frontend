import { Cliente } from './cliente.model';
import { OrdenServicio } from './orden-servicio.model';

export interface Vehiculo {
  id: number;
  id_cliente: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  cliente: Cliente;
  ordenes?: OrdenServicio[];
}
