import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RapportEvaluation, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class EvaluationsService {
  private api = inject(ApiService);
  private endpoint = '/rapportevaluation';

  getAll(params?: FilterParams): Observable<RapportEvaluation[]> {
    return this.api.get<RapportEvaluation[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<RapportEvaluation>> {
    return this.api.getPaginated<RapportEvaluation>(this.endpoint, params);
  }

  getById(id: string | number): Observable<RapportEvaluation> {
    return this.api.getById<RapportEvaluation>(this.endpoint, id);
  }

  create(data: Partial<RapportEvaluation>): Observable<RapportEvaluation> {
    return this.api.post<RapportEvaluation>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<RapportEvaluation>): Observable<RapportEvaluation> {
    return this.api.put<RapportEvaluation>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<RapportEvaluation[]> {
    return this.api.get<RapportEvaluation[]>(this.endpoint, { projetId });
  }

  getByType(type: string): Observable<RapportEvaluation[]> {
    return this.api.get<RapportEvaluation[]>(this.endpoint, { type });
  }
}

