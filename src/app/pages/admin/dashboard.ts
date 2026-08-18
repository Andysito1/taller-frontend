import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DashboardResumen } from '../models/dashboard-resumen.model';

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_ESTADO: Record<string, string> = {
  diagnostico: 'Diagnóstico',
  reparacion: 'Reparación',
  pruebas: 'Pruebas',
  finalizacion: 'Finalización',
  finalizado: 'Finalizado',
  pausado: 'Pausado',
};

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private adminService = inject(AdminService);

  public loading = signal(true);
  public error = signal<string | null>(null);
  public resumen = signal<DashboardResumen | null>(null);

  private hoy = new Date();
  public anioSeleccionado = signal(this.hoy.getFullYear());
  public mesSeleccionado = signal(this.hoy.getMonth() + 1); // 1-12

  public readonly meses = NOMBRES_MES.map((nombre, index) => ({ id: index + 1, nombre }));
  public readonly anios = Array.from({ length: 6 }, (_, i) => this.hoy.getFullYear() - i);

  public nombreMesActual = computed(() => {
    const mes = this.mesSeleccionado();
    return NOMBRES_MES[mes - 1] ?? '';
  });

  public estadoBreakdown = computed(() => {
    const data = this.resumen()?.por_estado ?? {};
    const total = Object.values(data).reduce((sum, v) => sum + v, 0);
    return Object.entries(data)
      .map(([estado, cantidad]) => ({
        estado,
        label: NOMBRES_ESTADO[estado] ?? estado,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  public mecanicoBreakdown = computed(() => {
    const data = this.resumen()?.por_mecanico ?? {};
    const max = Math.max(1, ...Object.values(data));
    return Object.entries(data).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / max) * 100),
    }));
  });

  public servicioBreakdown = computed(() => {
    const data = this.resumen()?.por_servicio ?? {};
    const max = Math.max(1, ...Object.values(data));
    return Object.entries(data).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / max) * 100),
    }));
  });

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getDashboardResumen(this.anioSeleccionado(), this.mesSeleccionado()).subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el resumen del dashboard:', err);
        this.error.set('No se pudo cargar el resumen del panel de control.');
        this.loading.set(false);
      },
    });
  }

  onMesChange(event: Event): void {
    this.mesSeleccionado.set(Number((event.target as HTMLSelectElement).value));
    this.cargarResumen();
  }

  onAnioChange(event: Event): void {
    this.anioSeleccionado.set(Number((event.target as HTMLSelectElement).value));
    this.cargarResumen();
  }

  irMesActual(): void {
    this.anioSeleccionado.set(this.hoy.getFullYear());
    this.mesSeleccionado.set(this.hoy.getMonth() + 1);
    this.cargarResumen();
  }

  getEtapaLabel(estado: string): string {
    return NOMBRES_ESTADO[estado] ?? estado;
  }
}
