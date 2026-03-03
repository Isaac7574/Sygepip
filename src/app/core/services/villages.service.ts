import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Village, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class VillagesService {
  private api = inject(ApiService);
  private endpoint = '/village';

  getAll(params?: FilterParams): Observable<Village[]> {
    return this.api.get<Village[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Village>> {
    return this.api.getPaginated<Village>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Village> {
    return this.api.getById<Village>(this.endpoint, id);
  }

  getByCommune(communeId: string): Observable<Village[]> {
    return this.api.get<Village[]>(`${this.endpoint}/commune/${communeId}`);
  }

  create(data: Partial<Village>): Observable<Village> {
    return this.api.post<Village>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Village>): Observable<Village> {
    return this.api.put<Village>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
