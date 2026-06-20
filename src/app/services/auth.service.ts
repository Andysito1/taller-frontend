import { Injectable, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environment';
import { Usuario } from '../pages/models/usuario.model';

interface AuthResponse {
  token?: string;
  access_token?: string;
  user?: Usuario;
  data?: Usuario;
  status?: string;
}

export interface PasswordResetRequest {
  correo: string;
  email?: string;
  codigo?: string;
  code?: string;
  token?: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  // Estado con Signals
  public currentUser = signal<Usuario | null>(null);
  public isAuthenticated = computed(() => this.currentUser() !== null);
  public userRole = computed(() => this.currentUser()?.rol?.nombre?.toUpperCase() || null);
  public userName = computed(() => this.currentUser()?.nombre || null);

  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  public splashSubject = new Subject<void>();

  getUserName(): string {
    return this.currentUser()?.nombre || '';
  }

  constructor() {
    // Usamos una comprobación doble de seguridad para el constructor del servicio global
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      const savedUser = localStorage.getItem(this.userKey);
      if (savedUser) {
        try { this.currentUser.set(JSON.parse(savedUser)); } catch { localStorage.removeItem(this.userKey); }
      }
    }
  }

  // --- Métodos de Autenticación ---

  login(credentials: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        const token = response.token || response.access_token;
        if (token) {
          const user = response.user || response.data;
          if (user) { 
            this.setSession(token, user);
            this.splashSubject.next();
          }
        }
      })
    );
  }

  private setSession(token: string, user: Usuario): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.currentUser.set(user);
  }

  // --- Métodos de Recuperación de Contraseña ---

  requestPasswordReset(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { correo: email });
  }

  verifyPasswordResetCode(email: string, code: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/verify-reset-code`, { correo: email, codigo: code });
  }

  resetPassword(data: PasswordResetRequest): Observable<unknown> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, data).pipe(
      tap(response => {
        const token = response.token || response.access_token;
        const user = response.user || response.data;
        if (token && user) {
          this.setSession(token, user);
          this.splashSubject.next();
        }
      })
    );
  }

  loginWithGoogle(): void {
    // CORREGIDO: Evita que el servidor intente acceder al objeto global 'window'
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${this.apiUrl}/auth/google`;
    }
  }

  handleAuthCallback(token: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/user`).pipe(
      tap(response => {
        this.setSession(token, response.data || (response as unknown as Usuario));
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUser.set(null);
    // Inyectamos el router localmente para romper la dependencia circular
    inject(Router).navigate(['/login']);
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(this.tokenKey) : null;
  }
}
