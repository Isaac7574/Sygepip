import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterParams, PaginatedResponse, IdeeProjet, IdeeProjetNoteConceptuelleRequest, IdeeProjetNoteConceptuelleResponse, MaturationActionRequestDTO } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class IdeesProjetService {
  private api = inject(ApiService);
  private endpoint = '/ideeprojet';
  private maturationEndpoint = '/maturation/ideeprojet';

  getAll(params?: FilterParams): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(this.endpoint, params);
  }

  getMesIdees(userId: string): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(`${this.endpoint}/mes-idees`, { userId, role: 'AGENT' });
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<IdeeProjet>> {
    return this.api.getPaginated<IdeeProjet>(this.endpoint, params);
  }

  getById(id: string | number): Observable<IdeeProjet> {
    return this.api.getById<IdeeProjet>(this.endpoint, id);
  }

  create(data: Partial<IdeeProjet>): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<IdeeProjet>): Observable<IdeeProjet> {
    return this.api.put<IdeeProjet>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByStatut(statut: string): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(this.endpoint, { statut });
  }

  getByMinistere(ministereId: number): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(this.endpoint, { ministereId });
  }

  soumettre(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/soumettre`, payload);
  }

  validerSommaire(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/valider-sommaire`, payload);
  }

  rejeterSommaire(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/rejeter-sommaire`, payload);
  }

  demarrerNoteConceptuelle(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/demarrer-note-conceptuelle`, payload);
  }

  soumettreNoteConceptuelle(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/soumettre-note-conceptuelle`, payload);
  }

  validerFaisabilite(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/valider-faisabilite`, payload);
  }

  soumettreProdoc(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/soumettre-prodoc`, payload);
  }

  validerProdoc(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/valider-prodoc`, payload);
  }

  identifierFinancement(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/identifier-financement`, payload);
  }

  soumettreDossierProjet(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/soumettre-dossier-projet`, payload);
  }

  validerDossierProjet(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/valider-dossier-projet`, payload);
  }

  retournerDossierProjet(id: string | number, payload: MaturationActionRequestDTO): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.maturationEndpoint}/${id}/retourner-dossier-projet`, payload);
  }

  // Récupérer par code
  getByCode(code: string): Observable<IdeeProjet> {
    return this.api.get<IdeeProjet>(`${this.endpoint}/code/${code}`);
  }

  // Récupérer les idées actives
  getActifs(): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(`${this.endpoint}/actifs`);
  }

  // Note conceptuelle
  getNoteConceptuelle(id: string | number): Observable<IdeeProjetNoteConceptuelleResponse> {
    return this.api.get<IdeeProjetNoteConceptuelleResponse>(`${this.endpoint}/${id}/note-conceptuelle`);
  }

  updateNoteConceptuelle(id: string | number, data: IdeeProjetNoteConceptuelleRequest): Observable<IdeeProjetNoteConceptuelleResponse> {
    return this.api.putUrl<IdeeProjetNoteConceptuelleResponse>(`${this.endpoint}/${id}/note-conceptuelle`, data);
  }
}

