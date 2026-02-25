import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Activite, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ActivitesService {
  private api = inject(ApiService);
  private endpoint = '/activite';

  getAll(params?: FilterParams): Observable<Activite[]> {
    return this.api.get<Activite[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Activite>> {
    return this.api.getPaginated<Activite>(this.endpoint, params);
  }

  getById(id: number): Observable<Activite> {
    return this.api.getById<Activite>(this.endpoint, id);
  }

  create(data: Partial<Activite>): Observable<Activite> {
    return this.api.post<Activite>(this.endpoint, data);
  }

  update(id: number, data: Partial<Activite>): Observable<Activite> {
    return this.api.put<Activite>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
