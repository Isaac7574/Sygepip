import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ScoreIdeeProjet, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ScoreIdeeProjetService {
  private api = inject(ApiService);
  private endpoint = '/scoreideeprojet';

  getAll(params?: FilterParams): Observable<ScoreIdeeProjet[]> {
    return this.api.get<ScoreIdeeProjet[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<ScoreIdeeProjet>> {
    return this.api.getPaginated<ScoreIdeeProjet>(this.endpoint, params);
  }

  getById(id: string | number): Observable<ScoreIdeeProjet> {
    return this.api.getById<ScoreIdeeProjet>(this.endpoint, id);
  }

  create(data: Partial<ScoreIdeeProjet>): Observable<ScoreIdeeProjet> {
    return this.api.post<ScoreIdeeProjet>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<ScoreIdeeProjet>): Observable<ScoreIdeeProjet> {
    return this.api.put<ScoreIdeeProjet>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

