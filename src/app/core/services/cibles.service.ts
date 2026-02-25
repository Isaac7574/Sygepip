import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cible, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CiblesService {
  private api = inject(ApiService);
  private endpoint = '/cible';

  getAll(params?: FilterParams): Observable<Cible[]> {
    return this.api.get<Cible[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Cible>> {
    return this.api.getPaginated<Cible>(this.endpoint, params);
  }

  getById(id: number): Observable<Cible> {
    return this.api.getById<Cible>(this.endpoint, id);
  }

  create(data: Partial<Cible>): Observable<Cible> {
    return this.api.post<Cible>(this.endpoint, data);
  }

  update(id: number, data: Partial<Cible>): Observable<Cible> {
    return this.api.put<Cible>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
