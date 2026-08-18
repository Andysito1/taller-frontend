import { OrdenServicio } from './orden-servicio.model';

export interface DashboardResumen {
  anio: number;
  mes: number;
  total_ordenes_mes: number;
  ordenes_finalizadas_mes: number;
  ordenes_activas_actual: number;
  ingresos_mes: number;
  ingreso_promedio_orden: number;
  por_estado: Record<string, number>;
  por_mecanico: Record<string, number>;
  por_servicio: Record<string, number>;
  ordenes: OrdenServicio[];
}
