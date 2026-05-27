import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import Swal from 'sweetalert2';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reports-container p-4 md:p-6" aria-labelledby="main-title">
      <header class="mb-8">
        <h1 id="main-title" class="text-3xl font-extrabold text-gray-900">Reportes Estratégicos</h1>
        <p class="text-gray-500 mt-2">Genera informes detallados de clientes y servicios en formato Excel para auditoría.</p>
      </header>

      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-3xl mx-auto">
        <div class="bg-green-600 p-1"></div>
        <form [formGroup]="reportForm" (ngSubmit)="descargarExcel()" class="p-8 space-y-6">
          
          <!-- Tipo de Filtro -->
          <div class="space-y-2">
            <label for="tipo_filtro" class="block text-sm font-bold text-gray-700">Configuración del Filtro</label>
            <select id="tipo_filtro" formControlName="tipo_filtro" 
                    class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-3"
                    aria-required="true">
              <option value="anio">Reporte Anual</option>
              <option value="mes_especifico">Reporte Mensual Específico</option>
              <option value="rango">Rango de Fechas Personalizado</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Año -->
            @if (filtroActivo() === 'anio' || filtroActivo() === 'mes_especifico') {
              <div class="space-y-2">
                <label for="anio" class="block text-sm font-bold text-gray-700">Año del Ejercicio</label>
                <input type="number" id="anio" formControlName="anio" 
                       class="w-full bg-white border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-200"
                       placeholder="Ej. 2024">
              </div>
            }

            <!-- Mes -->
            @if (filtroActivo() === 'mes_especifico') {
              <div class="space-y-2">
                <label for="mes" class="block text-sm font-bold text-gray-700">Mes</label>
                <select id="mes" formControlName="mes" class="w-full bg-white border border-gray-300 rounded-lg p-3">
                  @for (m of meses; track m.id) {
                    <option [value]="m.id">{{ m.nombre }}</option>
                  }
                </select>
              </div>
            }

            <!-- Rango -->
            @if (filtroActivo() === 'rango') {
              <div class="space-y-2">
                <label for="fecha_inicio" class="block text-sm font-bold text-gray-700">Fecha Inicial</label>
                <input type="date" id="fecha_inicio" formControlName="fecha_inicio" 
                       class="w-full border border-gray-300 rounded-lg p-3">
              </div>
              <div class="space-y-2">
                <label for="fecha_fin" class="block text-sm font-bold text-gray-700">Fecha Final</label>
                <input type="date" id="fecha_fin" formControlName="fecha_fin" 
                       class="w-full border border-gray-300 rounded-lg p-3">
              </div>
            }
          </div>

          @if (reportForm.hasError('rangoInvalido')) {
            <p class="text-red-600 text-sm font-medium" role="alert">La fecha final no puede ser anterior a la inicial.</p>
          }

          <div class="pt-6 border-t border-gray-100 flex justify-center">
            <button type="submit" 
                    [disabled]="reportForm.invalid || cargando()"
                    class="group relative w-full md:w-auto bg-green-700 hover:bg-green-800 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="flex items-center justify-center gap-3">
                @if (cargando()) {
                  <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Procesando Reporte...
                } @else {
                  Descargar Excel (.xlsx)
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background-color: #f8fafc; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reportes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);

  public cargando = signal(false);
  public meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];

  public reportForm = this.fb.group({
    tipo_filtro: ['anio', [Validators.required]],
    anio: [new Date().getFullYear(), [Validators.min(2000)]],
    mes: [new Date().getMonth() + 1],
    fecha_inicio: [''],
    fecha_fin: [''],
  }, { validators: this.rangoFechasValidator });

  public filtroActivo = computed(() => this.reportForm.get('tipo_filtro')?.value);

  ngOnInit(): void {}

  private rangoFechasValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fecha_inicio')?.value;
    const fin = control.get('fecha_fin')?.value;
    return (inicio && fin && new Date(inicio) > new Date(fin)) ? { rangoInvalido: true } : null;
  }

  public descargarExcel(): void {
    if (this.reportForm.invalid) return;

    this.cargando.set(true);
    Swal.fire({
      title: 'Generando Reporte',
      text: 'El servidor está compilando los datos. Esto puede tardar unos segundos.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.reportService.downloadClientServiceReport(this.reportForm.getRawValue()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_clientes_servicios_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.cargando.set(false);
        Swal.fire('¡Completado!', 'Tu reporte se ha descargado exitosamente.', 'success');
      },
      error: (err) => {
        this.cargando.set(false);
        console.error('Report Error:', err);
        Swal.fire('Error', 'Hubo un problema al generar el archivo. Intente más tarde.', 'error');
      }
    });
  }
}