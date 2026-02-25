import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CritereSelection, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CriteresSelectionService {
  private api = inject(ApiService);
  private endpoint = '/critereselection';

  getAll(params?: FilterParams): Observable<CritereSelection[]> {
    return this.api.get<CritereSelection[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<CritereSelection>> {
    return this.api.getPaginated<CritereSelection>(this.endpoint, params);
  }

  getById(id: string | number): Observable<CritereSelection> {
    return this.api.getById<CritereSelection>(this.endpoint, id);
  }

  create(data: Partial<CritereSelection>): Observable<CritereSelection> {
    return this.api.post<CritereSelection>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<CritereSelection>): Observable<CritereSelection> {
    return this.api.put<CritereSelection>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

