import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RapportPerformance, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RapportsService {
  private api = inject(ApiService);
  private endpoint = '/rapportperformance';

  getAll(params?: FilterParams): Observable<RapportPerformance[]> {
    return this.api.get<RapportPerformance[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<RapportPerformance>> {
    return this.api.getPaginated<RapportPerformance>(this.endpoint, params);
  }

  getById(id: string | number): Observable<RapportPerformance> {
    return this.api.getById<RapportPerformance>(this.endpoint, id);
  }

  create(data: Partial<RapportPerformance>): Observable<RapportPerformance> {
    return this.api.post<RapportPerformance>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<RapportPerformance>): Observable<RapportPerformance> {
    return this.api.put<RapportPerformance>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<RapportPerformance[]> {
    return this.api.get<RapportPerformance[]>(this.endpoint, { projetId });
  }

  getByAnnee(annee: number): Observable<RapportPerformance[]> {
    return this.api.get<RapportPerformance[]>(this.endpoint, { annee });
  }

  getByStatut(statut: string): Observable<RapportPerformance[]> {
    return this.api.get<RapportPerformance[]>(this.endpoint, { statut });
  }
}

