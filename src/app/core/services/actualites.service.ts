import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Actualite, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ActualitesService {
  private api = inject(ApiService);
  private endpoint = '/actualite';

  getAll(params?: FilterParams): Observable<Actualite[]> {
    return this.api.get<Actualite[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Actualite>> {
    return this.api.getPaginated<Actualite>(this.endpoint, params);
  }

  getById(id: number): Observable<Actualite> {
    return this.api.getById<Actualite>(this.endpoint, id);
  }

  create(data: Partial<Actualite>): Observable<Actualite> {
    return this.api.post<Actualite>(this.endpoint, data);
  }

  update(id: number, data: Partial<Actualite>): Observable<Actualite> {
    return this.api.put<Actualite>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
