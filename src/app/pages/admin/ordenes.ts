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
import { OrdenServicio } from '../models/orden-servicio.model';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ordenes.html',
  styleUrl: './ordenes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ordenes implements OnInit {
  private adminService = inject(AdminService);

  // State
  private allOrdenes = signal<OrdenServicio[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);

  // Filters
  public filtroBusqueda = signal<string>('');
  public filtroEstado = signal<string>('');

  public readonly estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  // Computed list of orders
  public ordenes = computed(() => {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.allOrdenes().filter((orden) => {
      const v = orden.vehiculo;
      const c = v?.cliente?.usuario;
      
      const matchBusqueda =
        !busqueda ||
        orden.id.toString().includes(busqueda) ||
        orden.titulo.toLowerCase().includes(busqueda) ||
        (v?.placa.toLowerCase().includes(busqueda) ?? false) ||
        (v?.marca.toLowerCase().includes(busqueda) ?? false) ||
        (c?.nombre.toLowerCase().includes(busqueda) ?? false);

      const matchEstado = !estado || orden.estado.toLowerCase() === estado.toLowerCase();

      return matchBusqueda && matchEstado;
    });
  });

  ngOnInit(): void {
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getOrdenes().subscribe({
      next: (data: OrdenServicio[]) => {
        this.allOrdenes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las órdenes:', err);
        this.error.set(
          'No se pudieron cargar las órdenes de servicio. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  onFiltroBusquedaChange(event: Event): void {
    this.filtroBusqueda.set((event.target as HTMLInputElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.filtroBusqueda.set('');
    this.filtroEstado.set('');
  }
}