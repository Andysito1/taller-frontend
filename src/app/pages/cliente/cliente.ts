import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ClienteService, Seguimiento } from '../../services/cliente.service';
import { Vehiculo } from '../models/vehiculo.model';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cliente implements OnInit {
  // Inyección de dependencias moderna con inject()
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private platformId = inject(PLATFORM_ID);

  // Estado del componente gestionado con Signals para reactividad optimizada
  public userName = signal<string | null>(null);
  public vehiculos = signal<Vehiculo[]>([]);
  public selectedVehiculo = signal<Vehiculo | null>(null);
  public seguimiento = signal<Seguimiento | null>(null);
  public loadingVehiculos = signal(true);
  public loadingSeguimiento = signal(false);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.userName.set(this.authService.getUserName());
    if (isPlatformBrowser(this.platformId)) {
      this.loadVehiculos();
    }
  }

  loadVehiculos(): void {
    this.loadingVehiculos.set(true);
    this.error.set(null);
    this.clienteService.getMisVehiculos().subscribe({
      next: (response) => {
        // La respuesta del backend puede venir envuelta en una propiedad 'data'.
        // Usamos el operador 'in' como type guard para verificar si la propiedad 'data' existe.
        const data = 'data' in response ? response.data : response;
        if (Array.isArray(data)) {
          this.vehiculos.set(data);
        } else {
          console.warn('La respuesta de vehículos no es un array:', response);
          this.vehiculos.set([]);
        }
        this.loadingVehiculos.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los vehículos:', err);
        this.error.set(
          'No se pudieron cargar tus vehículos. Inténtalo de nuevo más tarde.'
        );
        this.loadingVehiculos.set(false);
      },
    });
  }

  selectVehiculo(vehiculo: Vehiculo): void {
    this.selectedVehiculo.set(vehiculo);
    this.seguimiento.set(null); // Limpia la información de seguimiento anterior
    this.loadSeguimiento(vehiculo.id);
  }

  loadSeguimiento(vehiculoId: number): void {
    this.loadingSeguimiento.set(true);
    this.error.set(null);
    this.clienteService.getSeguimientoVehiculo(vehiculoId).subscribe({
      next: (response) => {
        // La respuesta del backend puede venir envuelta en una propiedad 'data'.
        // Usamos el operador 'in' como type guard para verificar de forma segura si la propiedad 'data' existe.
        this.seguimiento.set('data' in response ? response.data : response);
        this.loadingSeguimiento.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el seguimiento:', err);
        // Se añade un manejo de errores más específico y amigable para el usuario.
        if (err.status === 403) {
          this.error.set('No tienes permiso para ver el seguimiento de este vehículo.');
        } else {
          this.error.set('No se pudo cargar el seguimiento. Inténtalo de nuevo más tarde.');
        }
        this.seguimiento.set(null);
        this.loadingSeguimiento.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
