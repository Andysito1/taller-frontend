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
import { Usuario } from '../models/usuario.model';
import { Role } from '../models/role.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  private adminService = inject(AdminService);

  // State
  private allUsers = signal<Usuario[]>([]);
  public roles = signal<Role[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);

  // Filters
  public filtroNombre = signal<string>('');
  public filtroRol = signal<string>('');
  public filtroEstado = signal<string>(''); // 'activo', 'inactivo', o '' para todos

  public readonly estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  // Computed list of users
  public usuarios = computed(() => {
    const nombre = this.filtroNombre().toLowerCase().trim();
    const rolId = this.filtroRol();
    const estado = this.filtroEstado();

    return this.allUsers().filter((user) => {
      const matchNombre =
        !nombre ||
        user.nombre.toLowerCase().includes(nombre) ||
        user.correo.toLowerCase().includes(nombre);
      const matchRol = !rolId || user.id_rol === Number(rolId);
      const matchEstado =
        !estado || (estado === 'activo' ? user.activo : !user.activo);

      return matchNombre && matchRol && matchEstado;
    });
  });

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadRoles();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getUsuarios().subscribe({
      next: (data: Usuario[]) => {
        this.allUsers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los usuarios:', err);
        this.error.set(
          'No se pudieron cargar los usuarios. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data: Role[]) => this.roles.set(data),
      error: (err) => console.error('Error al cargar roles:', err),
    });
  }

  // --- Filter Handlers ---
  onFiltroNombreChange(event: Event): void {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
  }

  onFiltroRolChange(event: Event): void {
    this.filtroRol.set((event.target as HTMLSelectElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.filtroNombre.set('');
    this.filtroRol.set('');
    this.filtroEstado.set('');
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
        console.error('Error al cambiar estado del usuario:', err);
        alert('No se pudo cambiar el estado del usuario.');
      },
    });
  }

  deleteUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.adminService.deleteUsuario(id).subscribe({
        next: () => {
          this.allUsers.update((users) => users.filter((u) => u.id !== id));
          alert('Usuario eliminado exitosamente.');
        },
        error: () => alert('No se pudo eliminar el usuario.'),
      });
    }
  }
}