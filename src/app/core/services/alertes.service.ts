import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Alerte, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AlertesService {
  private api = inject(ApiService);
  private endpoint = '/alerte';

  getAll(params?: FilterParams): Observable<Alerte[]> {
    return this.api.get<Alerte[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Alerte>> {
    return this.api.getPaginated<Alerte>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Alerte> {
    return this.api.getById<Alerte>(this.endpoint, id);
  }

  create(data: Partial<Alerte>): Observable<Alerte> {
    return this.api.post<Alerte>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Alerte>): Observable<Alerte> {
    return this.api.put<Alerte>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<Alerte[]> {
    return this.api.get<Alerte[]>(this.endpoint, { projetId });
  }

  getNonTraitees(): Observable<Alerte[]> {
    return this.api.get<Alerte[]>(this.endpoint, { traitee: false });
  }

  traiter(id: number, action: string): Observable<Alerte> {
    return this.api.post<Alerte>(`${this.endpoint}/${id}/traiter`, { actionPrise: action });
  }
}

