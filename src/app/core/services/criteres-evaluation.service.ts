import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CritereEvaluation, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CriteresEvaluationService {
  private api = inject(ApiService);
  private endpoint = '/critereevaluation';

  getAll(params?: FilterParams): Observable<CritereEvaluation[]> {
    return this.api.get<CritereEvaluation[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<CritereEvaluation>> {
    return this.api.getPaginated<CritereEvaluation>(this.endpoint, params);
  }

  getById(id: string | number): Observable<CritereEvaluation> {
    return this.api.getById<CritereEvaluation>(this.endpoint, id);
  }

  create(data: Partial<CritereEvaluation>): Observable<CritereEvaluation> {
    return this.api.post<CritereEvaluation>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<CritereEvaluation>): Observable<CritereEvaluation> {
    return this.api.put<CritereEvaluation>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

