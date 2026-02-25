import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterParams, PaginatedResponse, IdeeProjet, IdeeProjetNoteConceptuelle } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class IdeesProjetService {
  private api = inject(ApiService);
  private endpoint = '/ideeprojet';

  getAll(params?: FilterParams): Observable<IdeeProjet[]> {
    return this.api.get<IdeeProjet[]>(this.endpoint, params);
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

  soumettre(id: number): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.endpoint}/${id}/soumettre`, {});
  }

  valider(id: number): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.endpoint}/${id}/valider`, {});
  }

  rejeter(id: number, motif: string): Observable<IdeeProjet> {
    return this.api.post<IdeeProjet>(`${this.endpoint}/${id}/rejeter`, { motif });
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
  getNoteConceptuelle(id: string | number): Observable<IdeeProjetNoteConceptuelle> {
    return this.api.get<IdeeProjetNoteConceptuelle>(`${this.endpoint}/${id}/note-conceptuelle`);
  }

  updateNoteConceptuelle(id: string | number, data: IdeeProjetNoteConceptuelle): Observable<IdeeProjetNoteConceptuelle> {
    return this.api.putUrl<IdeeProjetNoteConceptuelle>(`${this.endpoint}/${id}/note-conceptuelle`, data);
  }
}

