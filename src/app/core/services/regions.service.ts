import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Region, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RegionsService {
  private api = inject(ApiService);
  private endpoint = '/region';

  getAll(params?: FilterParams): Observable<Region[]> {
    return this.api.get<Region[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Region>> {
    return this.api.getPaginated<Region>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Region> {
    return this.api.getById<Region>(this.endpoint, id);
  }

  create(data: Partial<Region>): Observable<Region> {
    return this.api.post<Region>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Region>): Observable<Region> {
    return this.api.put<Region>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

