import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PisteAudit, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PisteAuditService {
  private api = inject(ApiService);
  private endpoint = '/pisteaudit';

  getAll(params?: FilterParams): Observable<PisteAudit[]> {
    return this.api.get<PisteAudit[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<PisteAudit>> {
    return this.api.getPaginated<PisteAudit>(this.endpoint, params);
  }

  getById(id: number): Observable<PisteAudit> {
    return this.api.getById<PisteAudit>(this.endpoint, id);
  }

  create(data: Partial<PisteAudit>): Observable<PisteAudit> {
    return this.api.post<PisteAudit>(this.endpoint, data);
  }

  update(id: number, data: Partial<PisteAudit>): Observable<PisteAudit> {
    return this.api.put<PisteAudit>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
