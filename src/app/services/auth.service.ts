import { Injectable, PLATFORM_ID, signal, computed, inject, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject, switchMap, of } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  // Estado con Signals
  public currentUser = signal<Usuario | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser());
  public userRole = computed(() => this.currentUser()?.rol?.nombre?.toUpperCase() || null);
  public userName = computed(() => this.currentUser()?.nombre || null);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  public splashSubject = new Subject<void>();

  getUserName(): string {
    return this.currentUser()?.nombre || '';
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
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

  register(data: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  verifyRegistrationCode(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-registration`, { email, code }).pipe(
      switchMap((response) => {
        if (response.token) {
          return this.handleAuthCallback(response.token);
        }
        return of(response);
      })
    );
  }

  // --- Métodos de Recuperación de Contraseña ---

  sendPasswordResetCode(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
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
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(this.tokenKey) : null;
  }
}