import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

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
    });
  }
}
