export interface FinanzaServicio {
  id?: number;
  id_orden: number;
  concepto: string;
  tipo: 'base' | 'adicional';
  monto: number;
  created_at?: string;
  updated_at?: string;
}