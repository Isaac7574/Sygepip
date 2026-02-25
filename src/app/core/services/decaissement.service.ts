import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Decaissement, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DecaissementService {
  private api = inject(ApiService);
  private endpoint = '/decaissement';

  getAll(params?: FilterParams): Observable<Decaissement[]> {
    return this.api.get<Decaissement[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Decaissement>> {
    return this.api.getPaginated<Decaissement>(this.endpoint, params);
  }

  getById(id: string): Observable<Decaissement> {
    return this.api.getById<Decaissement>(this.endpoint, id);
  }

  create(data: Partial<Decaissement>): Observable<Decaissement> {
    return this.api.post<Decaissement>(this.endpoint, data);
  }

  update(id: string, data: Partial<Decaissement>): Observable<Decaissement> {
    return this.api.put<Decaissement>(this.endpoint, id, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
