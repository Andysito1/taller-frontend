import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  downloadClientServiceReport(filters: unknown): Observable<Blob> {
    let params = new HttpParams();
    
    const f = filters as Record<string, any>;
    Object.keys(f).forEach(key => {
      if (f[key] !== null && f[key] !== undefined && f[key] !== '') {
        params = params.append(key, f[key]);
      }
    });

    return this.http.get(`${this.apiUrl}/clientes-servicios`, {
      params,
      responseType: 'blob'
    });
  }
}