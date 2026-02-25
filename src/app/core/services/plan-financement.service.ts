import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanFinancement, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PlanFinancementService {
  private api = inject(ApiService);
  private endpoint = '/planfinancement';

  getAll(params?: FilterParams): Observable<PlanFinancement[]> {
    return this.api.get<PlanFinancement[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<PlanFinancement>> {
    return this.api.getPaginated<PlanFinancement>(this.endpoint, params);
  }

  getById(id: string | number): Observable<PlanFinancement> {
    return this.api.getById<PlanFinancement>(this.endpoint, id);
  }

  create(data: Partial<PlanFinancement>): Observable<PlanFinancement> {
    return this.api.post<PlanFinancement>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<PlanFinancement>): Observable<PlanFinancement> {
    return this.api.put<PlanFinancement>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

