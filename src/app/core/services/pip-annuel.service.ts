import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PipAnnuel, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PipAnnuelService {
  private api = inject(ApiService);
  private endpoint = '/pipannuel';

  getAll(params?: FilterParams): Observable<PipAnnuel[]> {
    return this.api.get<PipAnnuel[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<PipAnnuel>> {
    return this.api.getPaginated<PipAnnuel>(this.endpoint, params);
  }

  getById(id: number): Observable<PipAnnuel> {
    return this.api.getById<PipAnnuel>(this.endpoint, id);
  }

  create(data: Partial<PipAnnuel>): Observable<PipAnnuel> {
    return this.api.post<PipAnnuel>(this.endpoint, data);
  }

  update(id: number, data: Partial<PipAnnuel>): Observable<PipAnnuel> {
    return this.api.put<PipAnnuel>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
