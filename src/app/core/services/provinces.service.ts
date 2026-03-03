import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Province, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ProvincesService {
  private api = inject(ApiService);
  private endpoint = '/province';

  getAll(params?: FilterParams): Observable<Province[]> {
    return this.api.get<Province[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Province>> {
    return this.api.getPaginated<Province>(this.endpoint, params);
  }

  getById(id: string | number): Observable<Province> {
    return this.api.getById<Province>(this.endpoint, id);
  }

  getByRegion(regionId: string): Observable<Province[]> {
    return this.api.get<Province[]>(`${this.endpoint}/region/${regionId}`);
  }

  create(data: Partial<Province>): Observable<Province> {
    return this.api.post<Province>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Province>): Observable<Province> {
    return this.api.put<Province>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
