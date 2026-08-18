import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { OrdenServicio } from '../models/orden-servicio.model';
import { FinanzaServicio } from '../models/finanza-servicio.model';

@Component({
  selector: 'app-finanzas',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Finanzas implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  private allOrdenes = signal<OrdenServicio[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public guardando = signal(false);
  public ordenSeleccionada = signal<OrdenServicio | null>(null);
  public showForm = signal(false);

  public filtroBusqueda = signal<string>('');

  public costoForm = this.fb.group({
    concepto: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['adicional', Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
  });

  public ordenes = computed(() => {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    return this.allOrdenes().filter((orden) => {
      if (!busqueda) return true;
      const v = orden.vehiculo;
      const c = v?.cliente?.usuario;
      return (
        orden.id.toString().includes(busqueda) ||
        orden.titulo.toLowerCase().includes(busqueda) ||
        (v?.placa.toLowerCase().includes(busqueda) ?? false) ||
        (c?.nombre.toLowerCase().includes(busqueda) ?? false)
      );
    });
  });

  public totalGeneral = computed(() =>
    this.ordenes().reduce((sum, orden) => sum + this.totalFinanzas(orden), 0)
  );

  ngOnInit(): void {
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getOrdenes().subscribe({
      next: (data) => {
        this.allOrdenes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las órdenes:', err);
        this.error.set('No se pudieron cargar las órdenes de servicio.');
        this.loading.set(false);
      },
    });
  }

  public totalFinanzas(orden: OrdenServicio): number {
    const finanzas = orden.finanzas || [];
    return finanzas.reduce((sum: number, f: FinanzaServicio) => sum + Number(f.monto || 0), 0);
  }

  onFiltroBusquedaChange(event: Event): void {
    this.filtroBusqueda.set((event.target as HTMLInputElement).value);
  }

  abrirDetalle(orden: OrdenServicio): void {
    this.ordenSeleccionada.set(orden);
    this.showForm.set(false);
    this.costoForm.reset({ concepto: '', tipo: 'adicional', monto: 0 });
  }

  abrirParaAgregarGasto(orden: OrdenServicio): void {
    this.ordenSeleccionada.set(orden);
    this.costoForm.reset({ concepto: '', tipo: 'adicional', monto: 0 });
    this.showForm.set(true);
  }

  cerrarDetalle(): void {
    this.ordenSeleccionada.set(null);
    this.showForm.set(false);
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  agregarCosto(): void {
    const orden = this.ordenSeleccionada();
    if (!orden) return;

    if (this.costoForm.invalid) {
      this.costoForm.markAllAsTouched();
      return;
    }

    if (orden.estado === 'finalizado') {
      Swal.fire('No permitido', 'No se pueden agregar costos a una orden finalizada.', 'warning');
      return;
    }

    this.guardando.set(true);
    const { concepto, tipo, monto } = this.costoForm.getRawValue();

    this.adminService
      .createFinanza({
        id_orden: orden.id,
        concepto: concepto!,
        tipo: tipo as 'base' | 'adicional',
        monto: Number(monto),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          Swal.fire({
            title: '¡Costo registrado!',
            icon: 'success',
            confirmButtonColor: '#0d6efd',
            timer: 1500,
            showConfirmButton: false,
          });
          this.costoForm.reset({ concepto: '', tipo: 'adicional', monto: 0 });
          this.showForm.set(false);

          this.adminService.getOrdenes().subscribe((data) => {
            this.allOrdenes.set(data);
            const actualizada = data.find((o) => o.id === orden.id);
            if (actualizada) this.ordenSeleccionada.set(actualizada);
          });
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.error || 'No se pudo registrar el costo.';
          Swal.fire('Error', msg, 'error');
        },
      });
  }
}
