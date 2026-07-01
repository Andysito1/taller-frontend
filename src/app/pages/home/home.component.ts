import { Component, signal, OnDestroy, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatbotMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly chatbotService = inject(ChatbotService);
  
  // Estado del slider
  currentIndex = signal(0);
  private intervalId: any;
  isChatOpen = signal(false);
  isLoading = signal(false);
  draftMessage = signal('');
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

    this.chatbotService.sendMessage(message, nextMessages).subscribe({
      next: (response: { reply: string; provider: string; status: string }) => {
        this.messages.update(current => [...current, { role: 'assistant', content: response.reply }]);
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

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
