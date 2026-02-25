import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SuiviExecution, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SuiviExecutionService {
  private api = inject(ApiService);
  private endpoint = '/suiviexecution';

  getAll(params?: FilterParams): Observable<SuiviExecution[]> {
    return this.api.get<SuiviExecution[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<SuiviExecution>> {
    return this.api.getPaginated<SuiviExecution>(this.endpoint, params);
  }

  getById(id: number): Observable<SuiviExecution> {
    return this.api.getById<SuiviExecution>(this.endpoint, id);
  }

  create(data: Partial<SuiviExecution>): Observable<SuiviExecution> {
    return this.api.post<SuiviExecution>(this.endpoint, data);
  }

  update(id: number, data: Partial<SuiviExecution>): Observable<SuiviExecution> {
    return this.api.put<SuiviExecution>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<SuiviExecution[]> {
    return this.api.get<SuiviExecution[]>(this.endpoint, { projetId });
  }

  getByAnnee(annee: number): Observable<SuiviExecution[]> {
    return this.api.get<SuiviExecution[]>(this.endpoint, { annee });
  }
}
