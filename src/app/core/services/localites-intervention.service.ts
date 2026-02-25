import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LocaliteIntervention, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class LocalitesInterventionService {
  private api = inject(ApiService);
  private endpoint = '/localiteintervention';

  getAll(params?: FilterParams): Observable<LocaliteIntervention[]> {
    return this.api.get<LocaliteIntervention[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<LocaliteIntervention>> {
    return this.api.getPaginated<LocaliteIntervention>(this.endpoint, params);
  }

  getById(id: number): Observable<LocaliteIntervention> {
    return this.api.getById<LocaliteIntervention>(this.endpoint, id);
  }

  create(data: Partial<LocaliteIntervention>): Observable<LocaliteIntervention> {
    return this.api.post<LocaliteIntervention>(this.endpoint, data);
  }

  update(id: number, data: Partial<LocaliteIntervention>): Observable<LocaliteIntervention> {
    return this.api.put<LocaliteIntervention>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
