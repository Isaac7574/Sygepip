import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriqueWorkflow, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueWorkflowService {
  private api = inject(ApiService);
  private endpoint = '/historiqueworkflow';

  getAll(params?: FilterParams): Observable<HistoriqueWorkflow[]> {
    return this.api.get<HistoriqueWorkflow[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<HistoriqueWorkflow>> {
    return this.api.getPaginated<HistoriqueWorkflow>(this.endpoint, params);
  }

  getById(id: string | number): Observable<HistoriqueWorkflow> {
    return this.api.getById<HistoriqueWorkflow>(this.endpoint, id);
  }

  create(data: Partial<HistoriqueWorkflow>): Observable<HistoriqueWorkflow> {
    return this.api.post<HistoriqueWorkflow>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<HistoriqueWorkflow>): Observable<HistoriqueWorkflow> {
    return this.api.put<HistoriqueWorkflow>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

