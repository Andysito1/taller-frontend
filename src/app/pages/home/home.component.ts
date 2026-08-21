import { Component, signal, OnDestroy, OnInit, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ChatbotService, ChatbotMessage } from '../../services/chatbot.service';
import { SolicitudReservaService } from '../../services/solicitud-reserva.service';
import { TipoDocumento } from '../models/tipo-documento.model';
import { correoValidator, documentoValidator } from '../../shared/document-validators';

const RESERVA_TRIGGER = '¿Te parece si solicitamos tu reserva?';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly chatbotService = inject(ChatbotService);
  private readonly solicitudReservaService = inject(SolicitudReservaService);
  private readonly fb = inject(FormBuilder);

  readonly whatsappUrl = 'https://api.whatsapp.com/send?phone=%2B51998980547&token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyNSJ9.eyJleHAiOjE3ODcwOTA0MTgsInBob25lIjoiKzUxOTk4OTgwNTQ3IiwiY29udGV4dCI6IkFmZ29xdUd2SHZqM1h2REJUOGdfY0hnc0tMTm1PYTBfb3VBSGtsZTFBWTNoRmFUWW8zLWVuZHIzQ0tMbGZYMWJrZ05vOXpnVFNnbUR5VldpdlE1TEczekUwV1pVYl9oNVYxSDdsVmFRWWpLMWdpTVM0dXZBVHJYWjlQRWFvaWV2Qkd0a2Rna3RzN21iY1ZZRWZLYVlqNnZqamciLCJzb3VyY2UiOiJGQl9QYWdlIiwiYXBwIjoiZmFjZWJvb2siLCJlbnRyeV9wb2ludCI6InBhZ2VfY3RhIn0.hT0Ddv5EF9F7OlTODNbMjV94EmkX2gjN8U4RDUVmtXNZzfiVtWbUiZCVxBDPAmntM8NrF0ne3h4vPVnLASe59A';

  // --- Solicitud de reserva ---
  public tiposDocumento = signal<TipoDocumento[]>([]);
  public enviandoReserva = signal(false);

  public reservaForm = this.fb.group({
    id_tipo_documento: ['', Validators.required],
    numero_documento: ['', [Validators.required, this.documentoValidatorReserva()]],
    correo: ['', [Validators.required, correoValidator()]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
    vehiculo_marca: ['', Validators.required],
    vehiculo_modelo: ['', Validators.required],
    vehiculo_anio: ['', [Validators.required, Validators.min(1980), Validators.max(new Date().getFullYear() + 1)]],
    problema: ['', Validators.required],
  });

  private documentoValidatorReserva() {
    return documentoValidator(
      () => this.getAbreviaturaSeleccionada(),
      () => this.getTipoSeleccionado()?.longitud_exacta,
      () => this.getTipoSeleccionado()?.longitud_maxima
    );
  }

  getTipoSeleccionado(): TipoDocumento | undefined {
    const id = this.reservaForm.get('id_tipo_documento')?.value;
    if (!id) return undefined;
    return this.tiposDocumento().find((t) => t.id === Number(id));
  }

  getAbreviaturaSeleccionada(): string {
    return this.getTipoSeleccionado()?.abreviatura?.toUpperCase() ?? '';
  }

  onTipoDocumentoChange(): void {
    this.reservaForm.get('numero_documento')?.updateValueAndValidity();
  }

  onTelefonoReservaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtrado = input.value.replace(/\D/g, '').slice(0, 15);
    if (filtrado !== input.value) {
      this.reservaForm.get('telefono')?.setValue(filtrado);
    }
  }

  enviarReserva(): void {
    if (this.reservaForm.invalid) {
      this.reservaForm.markAllAsTouched();
      return;
    }

    const value = this.reservaForm.getRawValue();
    this.enviandoReserva.set(true);

    this.solicitudReservaService.crear({
      id_tipo_documento: Number(value.id_tipo_documento),
      numero_documento: value.numero_documento!,
      correo: value.correo!,
      telefono: value.telefono!,
      vehiculo_marca: value.vehiculo_marca!,
      vehiculo_modelo: value.vehiculo_modelo!,
      vehiculo_anio: Number(value.vehiculo_anio),
      problema: value.problema!,
    }).subscribe({
      next: () => {
        this.enviandoReserva.set(false);
        this.reservaForm.reset();
        Swal.fire({
          title: '¡Solicitud enviada!',
          text: 'Nos comunicaremos contigo pronto para confirmar tu reserva.',
          icon: 'success',
          confirmButtonColor: '#e74c3c',
        });
      },
      error: () => {
        this.enviandoReserva.set(false);
        Swal.fire('Error', 'No se pudo enviar tu solicitud. Intenta nuevamente.', 'error');
      },
    });
  }

  // Estado del slider
  currentIndex = signal(0);
  private intervalId: any;
  isChatOpen = signal(false);
  isLoading = signal(false);
  draftMessage = signal('');
  ofreceReserva = signal(false);
  messages = signal<ChatbotMessage[]>([
    { role: 'assistant', content: 'Hola, soy Xtreme Assist. Puedo ayudarte a conocer nuestros servicios de mantenimiento, traccionamiento, planchado y pintura premium. ¿Qué te gustaría revisar?' }
  ]);

  services = signal([
    { 
      title: 'Traccionamiento', 
      desc: 'Optimización de sistemas AWD y 4WD con tecnología de vanguardia para garantizar estabilidad total en cualquier terreno.',
      img: 'assets/images/traccionamiento.jpg' 
    },
    { 
      title: 'Planchado', 
      desc: 'Recuperación de la geometría original de la carrocería mediante bancadas electrónicas que aseguran precisión milimétrica.',
      img: 'assets/images/planchado.jpg' 
    },
    { 
      title: 'Pintura Premium', 
      desc: 'Cabinas de pintura presurizadas y laboratorio de colorimetría para un acabado espejo idéntico al de fábrica.',
      img: 'assets/images/pintura.jpg' 
    },
    { 
      title: 'Mantenimiento', 
      desc: 'Servicio integral preventivo que maximiza la vida útil de su motor bajo los estándares más exigentes del mercado.',
      img: 'assets/images/mantenimiento.jpg' 
    }
  ]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
    }
  }

  ngOnInit(): void {
    this.solicitudReservaService.getTiposDocumento().subscribe({
      next: (data) => this.tiposDocumento.set(data),
      error: (err) => console.error('Error al cargar tipos de documento:', err),
    });
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => this.next(), 4000);
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.services().length);
  }

  prev() {
    this.currentIndex.update(i => (i - 1 + this.services().length) % this.services().length);
  }

  toggleChat() {
    this.isChatOpen.update(value => !value);
  }

  sendMessage() {
    const message = this.draftMessage().trim();
    if (!message) {
      return;
    }

    const userMessage: ChatbotMessage = { role: 'user', content: message };
    const nextMessages = [...this.messages(), userMessage];
    this.messages.set(nextMessages);
    this.draftMessage.set('');
    this.isLoading.set(true);
    this.ofreceReserva.set(false);

    this.chatbotService.sendMessage(message, nextMessages).subscribe({
      next: (response: { reply: string; provider: string; status: string }) => {
        this.messages.update(current => [...current, { role: 'assistant', content: response.reply }]);
        this.ofreceReserva.set(response.reply.includes(RESERVA_TRIGGER));
      },
      error: () => {
        this.messages.update(current => [...current, { role: 'assistant', content: 'Lo siento, no pude responder en este momento. Puedes escribirnos directamente o contactarnos para recibir ayuda personalizada.' }]);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  irAReserva(): void {
    // El propio resumen del asistente (el mensaje que trae la frase gatillo) describe
    // mejor el problema que el último mensaje del usuario, que suele ser solo una
    // confirmación breve ("sí", "dale") y no el detalle de la falla.
    const ultimoMensajeAsistente = [...this.messages()].reverse().find((m) => m.role === 'assistant');
    if (ultimoMensajeAsistente) {
      const resumen = ultimoMensajeAsistente.content.replace(RESERVA_TRIGGER, '').trim();
      this.reservaForm.get('problema')?.setValue(resumen);
    }

    this.isChatOpen.set(false);
    this.ofreceReserva.set(false);

    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
