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
import { Vehiculo } from '../models/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehiculos implements OnInit {
  private adminService = inject(AdminService);

  // State
  private allVehiculos = signal<Vehiculo[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);

  // Filter
  public filtroBusqueda = signal<string>('');

  // Computed list of vehicles
  public vehiculos = computed(() => {
    const filtro = this.filtroBusqueda().toLowerCase().trim();
    if (!filtro) {
      return this.allVehiculos();
    }

    return this.allVehiculos().filter(
      (v) =>
        v.marca.toLowerCase().includes(filtro) ||
        v.modelo.toLowerCase().includes(filtro) ||
        v.placa.toLowerCase().includes(filtro) ||
        v.cliente?.usuario?.nombre.toLowerCase().includes(filtro)
    );
  });

  ngOnInit(): void {
    this.loadVehiculos();
  }

  loadVehiculos(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getVehiculos().subscribe({
      next: (data: Vehiculo[]) => {
        this.allVehiculos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los vehículos:', err);
        this.error.set(
          'No se pudieron cargar los vehículos. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  onFiltroChange(event: Event): void {
    this.filtroBusqueda.set((event.target as HTMLInputElement).value);
  }

  clearFilter(): void {
    this.filtroBusqueda.set('');
  }

  deleteVehiculo(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      this.adminService.deleteVehiculo(id).subscribe({
        next: () => {
          this.allVehiculos.update((vehiculos) =>
            vehiculos.filter((v) => v.id !== id)
          );
          alert('Vehículo eliminado exitosamente.');
        },
        error: () => alert('No se pudo eliminar el vehículo.'),
      });
    }
  }

  // Helper to get mechanic name safely
  getMecanicoNombre(vehiculo: Vehiculo): string {
    if (
      vehiculo.ordenes &&
      vehiculo.ordenes.length > 0 &&
      vehiculo.ordenes[0].mecanico
    ) {
      return vehiculo.ordenes[0].mecanico.usuario.nombre;
    }
    return 'Sin asignar';
  }
}