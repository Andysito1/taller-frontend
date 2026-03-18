import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Mecanico } from '../pages/models/mecanico.model';
import { OrdenServicio } from '../pages/models/orden-servicio.model';
import { Role } from '../pages/models/role.model';
import { Usuario } from '../pages/models/usuario.model';
import { Vehiculo } from '../pages/models/vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private http = inject(HttpClient);

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<{ data: Usuario[] }>(`${this.apiUrl}/usuarios`).pipe(
      map((res) => res.data || res)
    );
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`);
  }

  createUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  toggleUsuarioActivo(id: number): Observable<{ activo: boolean }> {
    return this.http.patch<{ activo: boolean }>(`${this.apiUrl}/usuarios/${id}/toggle-activo`, {});
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<{ data: Role[] }>(`${this.apiUrl}/roles`).pipe(
      map((res) => res.data || res)
    );
  }

  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<{ data: Vehiculo[] }>(`${this.apiUrl}/vehiculos`).pipe(
      map((res) => res.data || res)
    );
  }

  deleteVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`);
  }

  getMecanicos(): Observable<Mecanico[]> {
    return this.http.get<{ data: Mecanico[] }>(`${this.apiUrl}/mecanicos`).pipe(
      map((res) => res.data || [])
    );
  }

  getOrdenes(): Observable<OrdenServicio[]> {
    // La respuesta del backend es un objeto paginado, por lo que necesitamos acceder a la propiedad `data.data`
    // para obtener el array de órdenes.
    return this.http.get<{ data: { data: OrdenServicio[] } }>(`${this.apiUrl}/ordenes-servicio`).pipe(
      map((res) => {
        // Aseguramos que devolvemos el array de órdenes que está dentro del objeto de paginación.
        return res.data.data || [];
      })
    );
  }
}