import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Projet, ProjetEditResponseDTO, FilterParams, PaginatedResponse } from '@core/models';
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

  getById(id: string | number): Observable<Projet> {
    return this.api.getById<Projet>(this.endpoint, id);
  }

  getEditById(id: string | number): Observable<ProjetEditResponseDTO> {
    return this.api.get<ProjetEditResponseDTO>(`${this.endpoint}/${id}/edit`);
  }

  create(data: Partial<Projet>): Observable<Projet> {
    return this.api.post<Projet>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Projet>): Observable<Projet> {
    return this.api.put<Projet>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
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

  updateProgrammationTechnique(id: string | number, data: Partial<Projet>): Observable<Projet> {
    return this.api.post<Projet>(`${this.endpoint}/${id}/programmation-technique`, data);
  }

  validerProgrammationTechnique(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/valider-programmation-technique`, payload);
  }

  validerProgrammationFinanciere(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/valider-programmation-financiere`, payload);
  }

  passerArbitrage(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/passer-arbitrage`, payload);
  }

  retenirArbitrage(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/retenir-arbitrage`, payload);
  }

  ajournerArbitrage(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/ajourner-arbitrage`, payload);
  }

  validerInscriptionPip(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/valider-inscription-pip`, payload);
  }

  passerExecution(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/passer-execution`, payload);
  }

  activerDecaissement(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/activer-decaissement`, payload);
  }

  selectionnerPip(
    id: string | number,
    payload: { userId?: string; commentaire?: string }
  ): Observable<Projet> {
    return this.api.post<Projet>(`${this.endpoint}/${id}/selectionner-pip`, payload);
  }

  getIndicateurs(id: string | number): Observable<any[]> {
    return this.api.get<any[]>(`${this.endpoint}/${id}/indicateurs`);
  }

  addIndicateurs(id: string | number, indicateurIds: string[]): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/indicateurs`, { indicateurIds });
  }

  removeIndicateurs(id: string | number, indicateurIds: string[]): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${id}/indicateurs/supprimer`, { indicateurIds });
  }
}

