import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Commune, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CommunesService {
  private api = inject(ApiService);
  private endpoint = '/commune';

  getAll(params?: FilterParams): Observable<Commune[]> {
    return this.api.get<Commune[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Commune>> {
    return this.api.getPaginated<Commune>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Commune> {
    return this.api.getById<Commune>(this.endpoint, id);
  }

  getByProvince(provinceId: string): Observable<Commune[]> {
    return this.api.get<Commune[]>(`${this.endpoint}/province/${provinceId}`);
  }

  create(data: Partial<Commune>): Observable<Commune> {
    return this.api.post<Commune>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Commune>): Observable<Commune> {
    return this.api.put<Commune>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
