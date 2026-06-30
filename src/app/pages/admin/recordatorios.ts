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
  templateUrl: './recordatorios.html',
  styleUrl: './recordatorios.scss',
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
