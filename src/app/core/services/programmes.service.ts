import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Programme, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammesService {
  private api = inject(ApiService);
  private endpoint = '/programme';

  getAll(params?: FilterParams): Observable<Programme[]> {
    return this.api.get<Programme[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Programme>> {
    return this.api.getPaginated<Programme>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Programme> {
    return this.api.getById<Programme>(this.endpoint, id);
  }

  create(data: Partial<Programme>): Observable<Programme> {
    return this.api.post<Programme>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Programme>): Observable<Programme> {
    return this.api.put<Programme>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByMinistere(ministereId: number): Observable<Programme[]> {
    return this.api.get<Programme[]>(this.endpoint, { ministereId });
  }

  getBySecteur(secteurId: number): Observable<Programme[]> {
    return this.api.get<Programme[]>(this.endpoint, { secteurId });
  }
}

