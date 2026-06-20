import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Cliente } from '../models/cliente.model';
import { resolveHttpErrorMessage } from '../../services/http-error-messages';

type ReminderTemplate = 'suave' | 'persuasiva';

@Component({
  selector: 'app-recordatorios',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reminders-shell">
      <div class="page-hero">
        <span class="eyebrow">Comunicaciones proactivas</span>
        <h2>Recordatorios por correo</h2>
        <p>Selecciona un cliente y envía un mensaje de seguimiento con un tono suave o más persuasivo.</p>
      </div>

      <div class="grid">
        <section class="panel">
          <h3>Seleccionar cliente</h3>
          <form [formGroup]="reminderForm" class="reminder-form" (ngSubmit)="sendReminder()">
            <div class="form-field">
              <label for="cliente_id">Cliente</label>
              <select id="cliente_id" formControlName="cliente_id">
                <option value="">Selecciona un cliente</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option [value]="cliente.id">{{ cliente.usuario.nombre || 'Cliente sin nombre' }} - {{ cliente.usuario.correo || 'sin correo' }}</option>
                }
              </select>
            </div>

            <div class="template-list">
              @for (template of templates; track template.id) {
                <button type="button" class="template-card" [class.active]="reminderForm.value.template === template.id" (click)="reminderForm.patchValue({ template: template.id })">
                  <strong>{{ template.title }}</strong>
                  <span>{{ template.description }}</span>
                </button>
              }
            </div>

            <button type="submit" class="primary-btn" [disabled]="loading() || reminderForm.invalid">
              @if (loading()) {
                Enviando...
              } @else {
                Enviar recordatorio
              }
            </button>
          </form>

          @if (error()) {
            <div class="status error">{{ error() }}</div>
          }

          @if (success()) {
            <div class="status success">{{ success() }}</div>
          }
        </section>

        <aside class="panel preview">
          <h3>Vista previa del mensaje</h3>
          <p class="preview-label">{{ selectedTemplateLabel() }}</p>
          <div class="preview-box">{{ selectedTemplateMessage() }}</div>
          <div class="preview-footer">
            <span>Canal: correo</span>
            <span>Marca: Xtreme Performance</span>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; color: #f5f5f5; }
    .reminders-shell { min-height: calc(100vh - 80px); background: linear-gradient(180deg, #09090b, #141416); padding: 0.5rem 0 2rem; }
    .page-hero { margin-bottom: 1.5rem; }
    .eyebrow { display: inline-flex; padding: 0.35rem 0.75rem; border-radius: 999px; background: rgba(239,68,68,.15); color: #fca5a5; font-size: .75rem; text-transform: uppercase; letter-spacing: .12em; }
    h2 { margin: 0.75rem 0 0.5rem; font-size: clamp(2rem, 4vw, 3rem); }
    .page-hero p { color: #b8b8be; max-width: 60ch; margin: 0; }
    .grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 1.25rem; }
    .panel { background: rgba(20, 20, 24, .92); border: 1px solid rgba(239,68,68,.18); border-radius: 24px; padding: 1.25rem; box-shadow: 0 25px 60px rgba(0,0,0,.35); }
    .panel h3 { margin: 0 0 1rem; font-size: 1.2rem; }
    .reminder-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .4rem; }
    label { font-weight: 600; color: #e7e7e7; }
    select { min-height: 48px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.05); color: #fff; padding: .85rem 1rem; }
    .template-list { display: grid; gap: .75rem; }
    .template-card { text-align: left; padding: 1rem; border-radius: 18px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04); color: #fff; cursor: pointer; display: grid; gap: .35rem; }
    .template-card.active { border-color: rgba(239,68,68,.65); box-shadow: 0 0 0 4px rgba(239,68,68,.12); }
    .template-card span { color: #b8b8be; font-size: .92rem; }
    .primary-btn { min-height: 48px; border: 0; border-radius: 14px; background: linear-gradient(135deg, #ef4444, #7f1d1d); color: #fff; font-weight: 700; }
    .primary-btn:disabled { opacity: .55; cursor: not-allowed; }
    .status { margin-top: 1rem; padding: .9rem 1rem; border-radius: 14px; }
    .status.success { background: rgba(34,197,94,.12); color: #bbf7d0; border: 1px solid rgba(34,197,94,.25); }
    .status.error { background: rgba(239,68,68,.12); color: #fecaca; border: 1px solid rgba(239,68,68,.25); }
    .preview-label { margin: 0 0 .75rem; color: #fca5a5; font-weight: 700; text-transform: uppercase; font-size: .75rem; letter-spacing: .12em; }
    .preview-box { min-height: 260px; border-radius: 18px; padding: 1rem; background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03)); border: 1px solid rgba(255,255,255,.06); white-space: pre-wrap; line-height: 1.65; }
    .preview-footer { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; color: #8f8f96; font-size: .85rem; }
    @media (max-width: 992px) { .grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recordatorios implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly templates: Array<{ id: ReminderTemplate; title: string; description: string; message: string }> = [
    {
      id: 'suave',
      title: 'Tono suave',
      description: 'Recuerda al cliente que siempre puede volver cuando necesite revisar su vehículo.',
      message: '¿No te hace falta alguna mejora? En Xtreme Performance te esperamos para revisar tu vehículo y mantenerlo listo para la ruta.',
    },
    {
      id: 'persuasiva',
      title: 'Tono persuasivo',
      description: 'Mensaje más directo para incentivar una visita al taller.',
      message: 'Los mecánicos extrañan tu auto. ¿No querrás arreglar algo? ¡Ven a Xtreme Performance y deja tu vehículo en manos expertas!',
    },
  ];

  readonly clients = signal<Cliente[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly reminderForm = this.fb.nonNullable.group({
    cliente_id: ['', [Validators.required]],
    template: ['suave' as ReminderTemplate, [Validators.required]],
  });

  readonly clientes = computed(() => this.clients().filter((cliente) => cliente.usuario?.activo !== false));

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getClientes().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(resolveHttpErrorMessage(error, 'recordatorio-correo'));
      },
    });
  }

  selectedTemplateLabel(): string {
    return this.templates.find((template) => template.id === this.reminderForm.value.template)?.title ?? 'Tono suave';
  }

  selectedTemplateMessage(): string {
    return this.templates.find((template) => template.id === this.reminderForm.value.template)?.message ?? this.templates[0].message;
  }

  sendReminder(): void {
    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      this.error.set('Selecciona un cliente y una plantilla de mensaje.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { cliente_id, template } = this.reminderForm.getRawValue();
    const message = this.selectedTemplateMessage();

    this.adminService.sendCustomerReminder(Number(cliente_id), template, message).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('El correo de recordatorio fue enviado correctamente.');
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(resolveHttpErrorMessage(error, 'recordatorio-correo'));
      },
    });
  }
}
