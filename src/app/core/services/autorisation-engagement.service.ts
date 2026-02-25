import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AutorisationEngagement, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AutorisationEngagementService {
  private api = inject(ApiService);
  private endpoint = '/autorisationengagement';

  getAll(params?: FilterParams): Observable<AutorisationEngagement[]> {
    return this.api.get<AutorisationEngagement[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<AutorisationEngagement>> {
    return this.api.getPaginated<AutorisationEngagement>(this.endpoint, params);
  }

  getById(id: string | number): Observable<AutorisationEngagement> {
    return this.api.getById<AutorisationEngagement>(this.endpoint, id);
  }

  create(data: Partial<AutorisationEngagement>): Observable<AutorisationEngagement> {
    return this.api.post<AutorisationEngagement>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<AutorisationEngagement>): Observable<AutorisationEngagement> {
    return this.api.put<AutorisationEngagement>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

