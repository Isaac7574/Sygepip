import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SourceFinancement, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SourcesFinancementService {
  private api = inject(ApiService);
  private endpoint = '/sourcefinancement';

  getAll(params?: FilterParams): Observable<SourceFinancement[]> {
    return this.api.get<SourceFinancement[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<SourceFinancement>> {
    return this.api.getPaginated<SourceFinancement>(this.endpoint, params);
  }

  getById(id: number): Observable<SourceFinancement> {
    return this.api.getById<SourceFinancement>(this.endpoint, id);
  }

  create(data: Partial<SourceFinancement>): Observable<SourceFinancement> {
    return this.api.post<SourceFinancement>(this.endpoint, data);
  }

  update(id: number, data: Partial<SourceFinancement>): Observable<SourceFinancement> {
    return this.api.put<SourceFinancement>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
