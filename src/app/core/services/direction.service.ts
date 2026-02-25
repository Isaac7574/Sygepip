import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Direction, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DirectionService {
  private api = inject(ApiService);
  private endpoint = '/direction';

  getAll(params?: FilterParams): Observable<Direction[]> {
    return this.api.get<Direction[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Direction>> {
    return this.api.getPaginated<Direction>(this.endpoint, params);
  }

  getById(id: string): Observable<Direction> {
    return this.api.getById<Direction>(this.endpoint, id);
  }

  getActifs(): Observable<Direction[]> {
    return this.api.get<Direction[]>(`${this.endpoint}/actifs`);
  }

  create(data: Partial<Direction>): Observable<Direction> {
    return this.api.post<Direction>(this.endpoint, data);
  }

  update(id: string, data: Partial<Direction>): Observable<Direction> {
    return this.api.put<Direction>(this.endpoint, id, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
