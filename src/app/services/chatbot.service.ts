import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timeout, catchError } from 'rxjs';
import { environment } from '../../environment';

const RESPUESTA_FALLBACK = {
  reply: 'Lo siento, no pude responder en este momento. Puedes escribirnos directamente o contactarnos para recibir ayuda personalizada.',
  provider: 'timeout-fallback',
  status: 'fallback',
};

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  sendMessage(message: string, history: ChatbotMessage[]): Observable<{ reply: string; provider: string; status: string }> {
    if (!isPlatformBrowser(this.platformId)) {
      return new Observable((observer) => {
        observer.next({ reply: 'El asistente no está disponible en este momento.', provider: 'offline', status: 'fallback' });
        observer.complete();
      });
    }

    return this.http.post<{ reply: string; provider: string; status: string }>(`${environment.apiUrl}/chatbot/message`, {
      message,
      history,
    }).pipe(
      // El backend ya responde en <20s con un mensaje de respaldo si Groq falla,
      // pero si la conexión se queda colgada (proxy, red, etc.) esto garantiza
      // que el chat nunca se quede esperando "Escribiendo..." indefinidamente.
      timeout(25000),
      catchError(() => of(RESPUESTA_FALLBACK))
    );
  }
}
