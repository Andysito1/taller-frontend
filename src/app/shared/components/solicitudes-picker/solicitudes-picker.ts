import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudReserva } from '../../../pages/models/solicitud-reserva.model';

@Component({
  selector: 'app-solicitudes-picker',
  imports: [CommonModule],
  templateUrl: './solicitudes-picker.html',
  styleUrl: './solicitudes-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudesPickerComponent {
  @Input() set solicitudes(value: SolicitudReserva[] | null) {
    this._solicitudes.set(value ?? []);
  }
  @Output() usar = new EventEmitter<SolicitudReserva>();

  private _solicitudes = signal<SolicitudReserva[]>([]);
  public busqueda = signal('');

  public solicitudesFiltradas = computed(() => {
    const filtro = this.busqueda().toLowerCase().trim();
    if (!filtro) return this._solicitudes();

    return this._solicitudes().filter((s) =>
      s.numero_documento.toLowerCase().includes(filtro) ||
      s.vehiculo_marca.toLowerCase().includes(filtro) ||
      s.vehiculo_modelo.toLowerCase().includes(filtro) ||
      s.correo.toLowerCase().includes(filtro)
    );
  });

  onBusquedaChange(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  usarSolicitud(solicitud: SolicitudReserva): void {
    this.usar.emit(solicitud);
  }
}
