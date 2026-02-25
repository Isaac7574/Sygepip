import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ministre, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class MinistresService {
  private api = inject(ApiService);
  private endpoint = '/ministre';

  getAll(params?: FilterParams): Observable<Ministre[]> {
    return this.api.get<Ministre[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Ministre>> {
    return this.api.getPaginated<Ministre>(this.endpoint, params);
  }

  getById(id: number): Observable<Ministre> {
    return this.api.getById<Ministre>(this.endpoint, id);
  }

  create(data: Partial<Ministre>): Observable<Ministre> {
    return this.api.post<Ministre>(this.endpoint, data);
  }

  update(id: number, data: Partial<Ministre>): Observable<Ministre> {
    return this.api.put<Ministre>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
