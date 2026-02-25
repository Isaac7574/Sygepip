import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TexteReglementaire, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class TextesReglementairesService {
  private api = inject(ApiService);
  private endpoint = '/textereglementaire';

  getAll(params?: FilterParams): Observable<TexteReglementaire[]> {
    return this.api.get<TexteReglementaire[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<TexteReglementaire>> {
    return this.api.getPaginated<TexteReglementaire>(this.endpoint, params);
  }

  getById(id: number): Observable<TexteReglementaire> {
    return this.api.getById<TexteReglementaire>(this.endpoint, id);
  }

  create(data: Partial<TexteReglementaire>): Observable<TexteReglementaire> {
    return this.api.post<TexteReglementaire>(this.endpoint, data);
  }

  update(id: number, data: Partial<TexteReglementaire>): Observable<TexteReglementaire> {
    return this.api.put<TexteReglementaire>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
