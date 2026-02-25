import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterParams, PaginatedResponse, CritereSelection, ScoreIdeeProjet } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ScoringService {
  private api = inject(ApiService);
  private endpoint = '/scoring';

  getAll(params?: FilterParams): Observable<CritereSelection[]> {
    return this.api.get<CritereSelection[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<CritereSelection>> {
    return this.api.getPaginated<CritereSelection>(this.endpoint, params);
  }

  getById(id: number): Observable<CritereSelection> {
    return this.api.getById<CritereSelection>(this.endpoint, id);
  }

  create(data: Partial<CritereSelection>): Observable<CritereSelection> {
    return this.api.post<CritereSelection>(this.endpoint, data);
  }

  update(id: number, data: Partial<CritereSelection>): Observable<CritereSelection> {
    return this.api.put<CritereSelection>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getScoresByIdeeProjet(ideeProjetId: number): Observable<ScoreIdeeProjet[]> {
    return this.api.get<ScoreIdeeProjet[]>(`${this.endpoint}/ideeprojet/${ideeProjetId}`);
  }

  evaluer(data: Partial<ScoreIdeeProjet>): Observable<ScoreIdeeProjet> {
    return this.api.post<ScoreIdeeProjet>(`${this.endpoint}/evaluer`, data);
  }
}
