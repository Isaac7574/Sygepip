import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Indicateur, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class IndicateursService {
  private api = inject(ApiService);
  private endpoint = '/indicateur';

  getAll(params?: FilterParams): Observable<Indicateur[]> {
    return this.api.get<Indicateur[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Indicateur>> {
    return this.api.getPaginated<Indicateur>(this.endpoint, params);
  }

  getById(id: number): Observable<Indicateur> {
    return this.api.getById<Indicateur>(this.endpoint, id);
  }

  create(data: Partial<Indicateur>): Observable<Indicateur> {
    return this.api.post<Indicateur>(this.endpoint, data);
  }

  update(id: number, data: Partial<Indicateur>): Observable<Indicateur> {
    return this.api.put<Indicateur>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<Indicateur[]> {
    return this.api.get<Indicateur[]>(this.endpoint, { projetId });
  }
}
