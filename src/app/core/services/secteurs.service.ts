import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Secteur, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SecteursService {
  private api = inject(ApiService);
  private endpoint = '/secteur';

  getAll(params?: FilterParams): Observable<Secteur[]> {
    return this.api.get<Secteur[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Secteur>> {
    return this.api.getPaginated<Secteur>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Secteur> {
    return this.api.getById<Secteur>(this.endpoint, id);
  }

  create(data: Partial<Secteur>): Observable<Secteur> {
    return this.api.post<Secteur>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Secteur>): Observable<Secteur> {
    return this.api.put<Secteur>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

