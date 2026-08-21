import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ChangeDetectorRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { TipoDocumento } from '../models/tipo-documento.model';
import { Usuario } from '../models/usuario.model';
import { Role } from '../models/role.model';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // State
  private allUsers = signal<Usuario[]>([]);
  public roles = signal<Role[]>([]);
  public tiposDocumento = signal<TipoDocumento[]>([]);
  public loading = signal(true);
  public loadingConsulta = signal(false);
  public error = signal<string | null>(null);
  public showForm = signal(false);
  public mostrarPassword = signal(false);
  public usuarioEditando = signal<Usuario | null>(null);

  // Filters
  public filtroNombre = signal<string>('');
  public filtroRol = signal<string>('');
  public filtroEstado = signal<string>(''); // 'activo', 'inactivo', o '' para todos

  public readonly estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  // Formulario
  public usuarioForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, this.correoValidator()]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    telefono: ['', [Validators.pattern(/^[0-9]*$/), Validators.maxLength(15)]],
    id_rol: ['', Validators.required],
    id_tipo_documento: ['', Validators.required],
    numero_documento: ['', [Validators.required, this.documentoValidator()]],
    direccion: [''],
    especialidad: [''], // Campo dinámico
  });

  // Acepta cualquier correo con formato válido (Gmail, dominios propios, .pe, .com, etc.)
  private correoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value as string) ?? '';
      if (!value) return null;
      return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value) ? null : { correoInvalido: true };
    };
  }

  // Exige el formato correcto de documento según el tipo seleccionado en el formulario:
  // DNI (8 dígitos), RUC (11 dígitos), CE (9 dígitos) y PASAPORTE (alfanumérico, sin símbolos)
  private documentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value as string) ?? '';
      if (!value) return null;

      switch (this.getAbreviaturaSeleccionada()) {
        case 'DNI':
          return /^[0-9]{8}$/.test(value) ? null : { docFormato: 'El DNI debe tener exactamente 8 dígitos numéricos.' };
        case 'RUC':
          return /^[0-9]{11}$/.test(value) ? null : { docFormato: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
        case 'CE':
          return /^[0-9]{9}$/.test(value) ? null : { docFormato: 'El Carnet de Extranjería debe tener exactamente 9 dígitos numéricos.' };
        case 'PAS':
        case 'PASAPORTE':
          return /^[a-zA-Z0-9]+$/.test(value) ? null : { docFormato: 'El pasaporte debe ser un código alfanumérico, sin símbolos ni espacios.' };
        default:
          return null;
      }
    };
  }

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

  // Computed para verificar si el rol seleccionado es mecánico
  public esMecanicoSeleccionado = computed(() => {
    const rolId = this.usuarioForm.get('id_rol')?.value;
    if (!rolId) return false;
    const rol = this.roles().find(r => r.id === Number(rolId));
    return rol?.nombre.toUpperCase() === 'MECANICO' || rol?.nombre.toUpperCase() === 'MECÁNICO';
  });

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadRoles();
    this.loadTiposDocumento();

    // Listener para cambiar validaciones de especialidad dinámicamente según el rol
    this.usuarioForm.get('id_rol')?.valueChanges.subscribe(() => {
      const especialidadControl = this.usuarioForm.get('especialidad');
      if (this.esMecanicoSeleccionado()) {
        especialidadControl?.setValidators([Validators.required]);
      } else {
        especialidadControl?.clearValidators();
        especialidadControl?.setValue('');
      }
      especialidadControl?.updateValueAndValidity();
    });

    // El formato válido del N° de documento depende del tipo elegido, así que
    // revalidamos numero_documento cada vez que el tipo de documento cambia.
    this.usuarioForm.get('id_tipo_documento')?.valueChanges.subscribe(() => {
      this.usuarioForm.get('numero_documento')?.updateValueAndValidity();
    });
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

  loadTiposDocumento(): void {
    this.adminService.getTiposDocumento().subscribe({
      next: (data: TipoDocumento[]) => this.tiposDocumento.set(data),
      error: (err) => {
        console.error('Error al cargar tipos de documento:', err);
        // Fallback: Cargamos datos por defecto si la API falla (404)
        this.tiposDocumento.set([
          { id: 1, nombre: 'DNI', abreviatura: 'DNI' },
          { id: 2, nombre: 'RUC', abreviatura: 'RUC' },
          { id: 3, nombre: 'CE', abreviatura: 'CE' },
          { id: 4, nombre: 'PASAPORTE', abreviatura: 'PAS' }
        ]);
      },
    });
  }

  // Helper para mostrar el nombre del rol en el título del formulario
  public getRolNombre(): string {
    const rolId = this.usuarioForm.get('id_rol')?.value;
    const rol = this.roles().find(r => r.id === Number(rolId));
    return rol?.nombre || 'Usuario';
  }

  // Helper para saber qué tipo de documento está seleccionado actualmente
  public getAbreviaturaSeleccionada(): string {
    const id = this.usuarioForm.get('id_tipo_documento')?.value;
    if (!id) return '';
    const tipo = this.tiposDocumento().find(t => t.id === Number(id));
    return tipo?.abreviatura.toUpperCase() || '';
  }

  consultarDocumento(): void {
    const id_tipo_documento = Number(this.usuarioForm.get('id_tipo_documento')?.value);
    const numeroControl = this.usuarioForm.get('numero_documento');
    const numero = numeroControl?.value;
    const tipo = this.getAbreviaturaSeleccionada();

    numeroControl?.markAsTouched();
    numeroControl?.updateValueAndValidity();

    const formatoValido =
      tipo === 'DNI' ? /^[0-9]{8}$/.test(numero ?? '') :
      tipo === 'RUC' ? /^[0-9]{11}$/.test(numero ?? '') :
      false;

    if (!formatoValido) {
      Swal.fire('Atención', `Ingrese un número de ${tipo} válido antes de consultar.`, 'warning');
      return;
    }

    this.loadingConsulta.set(true);
    this.adminService.consultarDocumento(id_tipo_documento, numero).subscribe({
      next: (res: any) => {
        console.log('Respuesta de API de consulta:', res);
        this.loadingConsulta.set(false);
        if (res.success && res.data) {
          this.usuarioForm.patchValue({ 
            nombre: res.data.nombre,
            direccion: res.data.direccion || ''
          });
          // Forzamos a OnPush a revisar el formulario
          this.cdr.markForCheck();
          
          Swal.fire({
            icon: 'success',
            title: `${tipo} Encontrado`,
            text: res.data.nombre,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire('No encontrado', 'No se obtuvieron datos para este documento.', 'info');
        }
      },
      error: (err) => {
        this.loadingConsulta.set(false);
        const errorMsg = err.error?.error || 'Error al conectar con el servicio de consulta.';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword.update((v) => !v);
  }

  // Filtra cualquier carácter que no sea un dígito y limita a 15 dígitos mientras el usuario escribe
  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtrado = input.value.replace(/\D/g, '').slice(0, 15);
    if (filtrado !== input.value) {
      this.usuarioForm.get('telefono')?.setValue(filtrado);
    }
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

  // --- Actions ---
  toggleForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.usuarioEditando.set(null);
      this.mostrarPassword.set(false);
      this.usuarioForm.reset({ id_rol: '', id_tipo_documento: '' });
      this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.usuarioForm.get('password')?.updateValueAndValidity();
    }
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando.set(usuario);
    this.mostrarPassword.set(false);

    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      id_rol: String(usuario.id_rol),
      id_tipo_documento: usuario.tipo_documento ? String(usuario.tipo_documento.id) : '',
      numero_documento: usuario.numero_documento ?? '',
      direccion: usuario.direccion ?? '',
      especialidad: usuario.mecanico?.especialidad ?? '',
      password: '',
    });

    // En edición la contraseña es opcional: solo se envía si el admin la escribe
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.setValidators([Validators.minLength(8)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();

    this.showForm.set(true);
  }

  saveUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    // Extraemos especialidad y password por separado para manejar su lógica condicional
    const { especialidad, password, ...formValue } = this.usuarioForm.getRawValue();
    const usuarioEditando = this.usuarioEditando();

    // Preparamos el payload convirtiendo IDs a números para el backend
    const payload: Record<string, unknown> = {
      ...formValue,
      id_rol: Number(formValue.id_rol),
      id_tipo_documento: Number(formValue.id_tipo_documento),
      ...(this.esMecanicoSeleccionado() ? { especialidad } : {})
    };

    // En creación la contraseña siempre viaja; en edición solo si el admin la cambió
    if (!usuarioEditando || password) {
      payload['password'] = password;
    }

    const request$ = usuarioEditando
      ? this.adminService.updateUsuario(usuarioEditando.id, payload as Partial<Usuario>)
      : this.adminService.createUsuario(payload as Partial<Usuario>);

    request$.subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: usuarioEditando ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
          icon: 'success',
          confirmButtonColor: '#198754'
        });
        this.loadUsuarios();
        this.toggleForm();
      },
      error: (err) => {
        console.error('Error al guardar usuario:', err);
        Swal.fire('Error', `No se pudo ${usuarioEditando ? 'actualizar' : 'crear'} el usuario. Revisa los datos.`, 'error');
        this.loading.set(false);
      }
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
        console.error('Error al cambiar estado del usuario:', err);
        Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
      },
    });
  }

  deleteUsuario(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteUsuario(id).subscribe({
          next: () => {
            this.allUsers.update((users) => users.filter((u) => u.id !== id));
            Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error'),
        });
      }
    });
  }
}