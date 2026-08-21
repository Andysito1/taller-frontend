import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TipoDocumento } from '../pages/models/tipo-documento.model';
import { environment } from '../../environment';

export interface NuevaSolicitudReserva {
  id_tipo_documento: number;
  numero_documento: string;
  correo: string;
  telefono: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio: number;
  problema: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudReservaService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-documento-publico`).pipe(
      map((res) => (Array.isArray(res) ? res : res?.data ?? []))
    );
  }

  crear(payload: NuevaSolicitudReserva): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes-reserva`, payload);
  }
}
