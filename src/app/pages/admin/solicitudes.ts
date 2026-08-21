import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { EstadoSolicitudReserva, SolicitudReserva } from '../models/solicitud-reserva.model';

@Component({
  selector: 'app-solicitudes',
  imports: [CommonModule],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes implements OnInit {
  private adminService = inject(AdminService);

  public solicitudes = signal<SolicitudReserva[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public filtroEstado = signal<EstadoSolicitudReserva | ''>('pendiente');

  public readonly estados: { value: EstadoSolicitudReserva | ''; label: string }[] = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'atendida', label: 'Atendidas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: '', label: 'Todas' },
  ];

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.loading.set(true);
    this.error.set(null);
    const estado = this.filtroEstado() || undefined;
    this.adminService.getSolicitudes(estado).subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las solicitudes:', err);
        this.error.set('No se pudieron cargar las solicitudes. Verifica la conexión.');
        this.loading.set(false);
      },
    });
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value as EstadoSolicitudReserva | '');
    this.loadSolicitudes();
  }

  marcarAtendida(solicitud: SolicitudReserva): void {
    Swal.fire({
      title: '¿Marcar como atendida?',
      text: 'Confirma que esta solicitud ya se convirtió en una reserva real.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar atendida',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.adminService.updateEstadoSolicitud(solicitud.id, 'atendida').subscribe({
        next: () => {
          this.solicitudes.update((lista) => lista.filter((s) => s.id !== solicitud.id));
          Swal.fire('Listo', 'La solicitud fue marcada como atendida.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la solicitud.', 'error'),
      });
    });
  }

  rechazarSolicitud(solicitud: SolicitudReserva): void {
    Swal.fire({
      title: 'Rechazar solicitud',
      input: 'text',
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ej: No se pudo contactar al cliente',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.adminService.updateEstadoSolicitud(solicitud.id, 'rechazada', result.value || undefined).subscribe({
        next: () => {
          this.solicitudes.update((lista) => lista.filter((s) => s.id !== solicitud.id));
          Swal.fire('Listo', 'La solicitud fue rechazada.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la solicitud.', 'error'),
      });
    });
  }

  estadoBadgeClass(estado: EstadoSolicitudReserva): string {
    switch (estado) {
      case 'atendida': return 'bg-success';
      case 'rechazada': return 'bg-danger';
      default: return 'bg-warning text-dark';
    }
  }
}
