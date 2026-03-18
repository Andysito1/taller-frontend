import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrdenServicio } from '../pages/models/orden-servicio.model';

@Injectable({
  providedIn: 'root'
})
export class MecanicoService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private http = inject(HttpClient);

  getMisOrdenes(): Observable<OrdenServicio[]> {
    // La respuesta del backend es un objeto paginado, por lo que necesitamos acceder a `data.data`
    // para obtener el array de órdenes.
    return this.http.get<{ data: { data: OrdenServicio[] } }>(`${this.apiUrl}/mis-ordenes`).pipe(
      map(res => res.data.data || [])
    );
  }
}