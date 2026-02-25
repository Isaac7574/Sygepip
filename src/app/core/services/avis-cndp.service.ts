import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AvisConformiteCNDP, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AvisCndpService {
  private api = inject(ApiService);
  private endpoint = '/avisconformitecndp';

  getAll(params?: FilterParams): Observable<AvisConformiteCNDP[]> {
    return this.api.get<AvisConformiteCNDP[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<AvisConformiteCNDP>> {
    return this.api.getPaginated<AvisConformiteCNDP>(this.endpoint, params);
  }

  getById(id: number): Observable<AvisConformiteCNDP> {
    return this.api.getById<AvisConformiteCNDP>(this.endpoint, id);
  }

  create(data: Partial<AvisConformiteCNDP>): Observable<AvisConformiteCNDP> {
    return this.api.post<AvisConformiteCNDP>(this.endpoint, data);
  }

  update(id: number, data: Partial<AvisConformiteCNDP>): Observable<AvisConformiteCNDP> {
    return this.api.put<AvisConformiteCNDP>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
