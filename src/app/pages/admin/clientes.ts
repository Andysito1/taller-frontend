import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { Usuario } from '../models/usuario.model';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes implements OnInit {
  private adminService = inject(AdminService);

  // State como signals para un manejo de estado reactivo y eficiente
  private allUsers = signal<Usuario[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public sendingReminderId = signal<number | null>(null);
  public reminderTemplate = signal<'suave' | 'persuasiva'>('suave');
  public reminderSuccess = signal<string | null>(null);
  public reminderError = signal<string | null>(null);

  // Signals para los filtros
  public filtroNombre = signal<string>('');
  public filtroTipoDoc = signal<string>('');
  public filtroEstado = signal<string>(''); // 'activo', 'inactivo', o '' para todos

  public readonly tiposDocumento: ('DNI' | 'RUC' | 'CE' | 'PAS')[] = ['DNI', 'RUC', 'CE', 'PAS'];
  public readonly estados = [{value: 'activo', label: 'Activo'}, {value: 'inactivo', label: 'Inactivo'}];
  public readonly reminderTemplates = [
    { id: 'suave' as const, label: 'Suave', text: '¿No te hace falta alguna mejora? En Xtreme Performance te esperamos para revisar tu vehículo.' },
    { id: 'persuasiva' as const, label: 'Persuasiva', text: 'Los mecánicos extrañan tu auto. ¿No querrás arreglar algo? ¡Ven a Xtreme Performance y deja tu auto en manos expertas!' },
  ];

  // Derivamos la lista de clientes desde la señal de todos los usuarios
  public clientes = computed(() => {
    const baseClientes = this.allUsers().filter(
      (u) => u.rol?.nombre.toUpperCase() === 'CLIENTE'
    );

    const nombre = this.filtroNombre().toLowerCase().trim();
    const tipoDoc = this.filtroTipoDoc();
    const estado = this.filtroEstado();

    if (!nombre && !tipoDoc && !estado) {
      return baseClientes;
    }

    return baseClientes.filter(cliente => {
      const matchNombre = !nombre || cliente.nombre.toLowerCase().includes(nombre) || (cliente.numero_documento ?? '').includes(nombre);
      const matchTipoDoc = !tipoDoc || cliente.tipo_documento?.abreviatura === tipoDoc;
      const matchEstado = !estado || (estado === 'activo' ? cliente.activo : !cliente.activo);

      return matchNombre && matchTipoDoc && matchEstado;
    });
  });

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getUsuarios().subscribe({
      next: (data: Usuario[]) => {
        this.allUsers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
        this.error.set(
          'No se pudieron cargar los clientes. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  // --- Manejadores de eventos para los filtros ---
  onFiltroNombreChange(event: Event): void {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
  }

  onFiltroTipoDocChange(event: Event): void {
    this.filtroTipoDoc.set((event.target as HTMLSelectElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.filtroNombre.set('');
    this.filtroTipoDoc.set('');
    this.filtroEstado.set('');
  }

  sendReminder(cliente: Usuario): void {
    this.sendingReminderId.set(cliente.id);
    this.reminderSuccess.set(null);
    this.reminderError.set(null);

    const template = this.reminderTemplate();
    const message = this.reminderTemplates.find((item) => item.id === template)?.text;

    this.adminService.sendCustomerReminder(cliente.id, template, message).subscribe({
      next: () => {
        this.sendingReminderId.set(null);
        this.reminderSuccess.set(`Recordatorio enviado a ${cliente.nombre}.`);
      },
      error: (error) => {
        this.sendingReminderId.set(null);
        this.reminderError.set(resolveHttpErrorMessage(error, 'recordatorio-correo'));
        console.error('Error al enviar recordatorio:', error);
      },
    });
  }

  toggleActivo(id: number): void {
    this.adminService.toggleUsuarioActivo(id).subscribe({
      next: (response) => {
        this.allUsers.update((users) =>
          users.map((user) =>
            user.id === id ? { ...user, activo: response.activo } : user
          )
        );
      },
      error: (err) => {
        console.error('Error al cambiar estado del cliente:', err);
        Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
      },
    });
  }

  deleteCliente(id: number): void {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: 'Se borrarán todos los datos asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteUsuario(id).subscribe({
          next: () => {
            this.allUsers.update((users) => users.filter((u) => u.id !== id));
            Swal.fire('Eliminado', 'Cliente borrado correctamente', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error'),
        });
      }
    });
  }
}
