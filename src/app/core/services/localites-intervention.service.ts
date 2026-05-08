import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FilterParams,
  IdeeProjetLocaliteIntervention,
  IdeeProjetLocaliteInterventionPayload,
  LocaliteIntervention,
  PaginatedResponse
} from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class LocalitesInterventionService {
  private api = inject(ApiService);
  private endpoint = '/localiteintervention';
  private ideeProjetEndpoint = '/ideeprojet';

  getAll(params?: FilterParams): Observable<LocaliteIntervention[]> {
    return this.api.get<LocaliteIntervention[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<LocaliteIntervention>> {
    return this.api.getPaginated<LocaliteIntervention>(this.endpoint, params);
  }

  getById(id: string | number): Observable<LocaliteIntervention> {
    return this.api.getById<LocaliteIntervention>(this.endpoint, id);
  }

  getByProjet(projetId: string): Observable<LocaliteIntervention[]> {
    return this.api.get<LocaliteIntervention[]>(`${this.endpoint}/projet/${projetId}`);
  }

  getByIdeeProjet(ideeProjetId: string | number): Observable<IdeeProjetLocaliteIntervention[]> {
    return this.api.get<IdeeProjetLocaliteIntervention[]>(
      `${this.ideeProjetEndpoint}/${ideeProjetId}/localites-intervention`
    );
  }

  replaceForIdeeProjet(
    ideeProjetId: string | number,
    data: IdeeProjetLocaliteInterventionPayload[]
  ): Observable<IdeeProjetLocaliteIntervention[]> {
    return this.api.putUrl<IdeeProjetLocaliteIntervention[]>(
      `${this.ideeProjetEndpoint}/${ideeProjetId}/localites-intervention`,
      data
    );
  }

  create(data: Partial<LocaliteIntervention>): Observable<LocaliteIntervention> {
    return this.api.post<LocaliteIntervention>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<LocaliteIntervention>): Observable<LocaliteIntervention> {
    return this.api.put<LocaliteIntervention>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

