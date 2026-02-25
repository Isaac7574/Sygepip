import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ministere, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class MinisteresService {
  private api = inject(ApiService);
  private endpoint = '/ministere';

  getAll(params?: FilterParams): Observable<Ministere[]> {
    return this.api.get<Ministere[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Ministere>> {
    return this.api.getPaginated<Ministere>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Ministere> {
    return this.api.getById<Ministere>(this.endpoint, id);
  }

  create(data: Partial<Ministere>): Observable<Ministere> {
    return this.api.post<Ministere>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Ministere>): Observable<Ministere> {
    return this.api.put<Ministere>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

