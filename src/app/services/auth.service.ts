import { Injectable, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environment';
import { Usuario } from '../pages/models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  // Estado con Signals
  public currentUser = signal<Usuario | null>(null);
  public isAuthenticated = computed(() => !!this.getToken());
  public userRole = computed(() => this.currentUser()?.rol?.nombre?.toUpperCase() || null);

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem(this.userKey);
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
      }
    }
  }

  loginWithGoogle(): void {
    // Redirección directa al endpoint de Laravel Socialite
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  handleAuthCallback(token: string): Observable<any> {
    localStorage.setItem(this.tokenKey, token);
    // Obtenemos los datos del usuario después de guardar el token
    return this.http.get<any>(`${this.apiUrl}/user`).pipe(
      tap(response => {
        const user = response.data || response;
        this.currentUser.set(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
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
