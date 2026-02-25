import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterParams, PaginatedResponse, WorkflowEtape } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private api = inject(ApiService);
  private endpoint = '/workflow';

  getAll(params?: FilterParams): Observable<WorkflowEtape[]> {
    return this.api.get<WorkflowEtape[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<WorkflowEtape>> {
    return this.api.getPaginated<WorkflowEtape>(this.endpoint, params);
  }

  getById(id: number): Observable<WorkflowEtape> {
    return this.api.getById<WorkflowEtape>(this.endpoint, id);
  }

  create(data: Partial<WorkflowEtape>): Observable<WorkflowEtape> {
    return this.api.post<WorkflowEtape>(this.endpoint, data);
  }

  update(id: number, data: Partial<WorkflowEtape>): Observable<WorkflowEtape> {
    return this.api.put<WorkflowEtape>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByModule(module: string): Observable<WorkflowEtape[]> {
    return this.api.get<WorkflowEtape[]>(this.endpoint, { module });
  }
}
