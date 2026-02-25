import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PipAnnuel, FilterParams, PaginatedResponse, InscriptionPipAnnuel, InscriptionPipAnnuelRequest, RetraitInscriptionPipAnnuelRequest } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PipAnnuelService {
  private api = inject(ApiService);
  private endpoint = '/pipannuel';

  getAll(params?: FilterParams): Observable<PipAnnuel[]> {
    return this.api.get<PipAnnuel[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<PipAnnuel>> {
    return this.api.getPaginated<PipAnnuel>(this.endpoint, params);
  }

  getById(id: string | number): Observable<PipAnnuel> {
    return this.api.getById<PipAnnuel>(this.endpoint, id);
  }

  create(data: Partial<PipAnnuel>): Observable<PipAnnuel> {
    return this.api.post<PipAnnuel>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<PipAnnuel>): Observable<PipAnnuel> {
    return this.api.put<PipAnnuel>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  // Récupérer par code
  getByCode(code: string): Observable<PipAnnuel> {
    return this.api.get<PipAnnuel>(`${this.endpoint}/code/${code}`);
  }

  // Récupérer les PIP actifs
  getActifs(): Observable<PipAnnuel[]> {
    return this.api.get<PipAnnuel[]>(`${this.endpoint}/actifs`);
  }

  // === INSCRIPTIONS ===

  // Récupérer les inscriptions actives d'un PIP annuel
  getInscriptions(pipAnnuelId: string): Observable<InscriptionPipAnnuel[]> {
    return this.api.get<InscriptionPipAnnuel[]>(`${this.endpoint}/${pipAnnuelId}/inscriptions`);
  }

  // Inscrire un projet au PIP annuel
  inscrireProjet(pipAnnuelId: string, data: InscriptionPipAnnuelRequest): Observable<InscriptionPipAnnuel> {
    return this.api.post<InscriptionPipAnnuel>(`${this.endpoint}/${pipAnnuelId}/inscriptions`, data);
  }

  // Retirer un projet du PIP annuel
  retirerProjet(pipAnnuelId: string, projetId: string, data?: RetraitInscriptionPipAnnuelRequest): Observable<InscriptionPipAnnuel> {
    return this.api.deleteWithBody<InscriptionPipAnnuel>(`${this.endpoint}/${pipAnnuelId}/inscriptions/${projetId}`, data);
  }
}

