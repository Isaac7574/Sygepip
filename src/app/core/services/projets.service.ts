import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Projet, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProjetsService {
  private api = inject(ApiService);
  private endpoint = '/projet';

  getAll(params?: FilterParams): Observable<Projet[]> {
    return this.api.get<Projet[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Projet>> {
    return this.api.getPaginated<Projet>(this.endpoint, params);
  }

  getById(id: number): Observable<Projet> {
    return this.api.getById<Projet>(this.endpoint, id);
  }

  create(data: Partial<Projet>): Observable<Projet> {
    return this.api.post<Projet>(this.endpoint, data);
  }

  update(id: number, data: Partial<Projet>): Observable<Projet> {
    return this.api.put<Projet>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByMinistere(ministereId: number): Observable<Projet[]> {
    return this.api.get<Projet[]>(this.endpoint, { ministereId });
  }

  getByStatut(statut: string): Observable<Projet[]> {
    return this.api.get<Projet[]>(this.endpoint, { statut });
  }

  getBySecteur(secteurId: number): Observable<Projet[]> {
    return this.api.get<Projet[]>(this.endpoint, { secteurId });
  }
}
