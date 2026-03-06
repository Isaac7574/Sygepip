import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NatureDepense, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class NatureDepenseService {
  private api = inject(ApiService);
  private endpoint = '/nature-depense';

  getAll(params?: FilterParams): Observable<NatureDepense[]> {
    return this.api.get<NatureDepense[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<NatureDepense>> {
    return this.api.getPaginated<NatureDepense>(this.endpoint, params);
  }

  getById(id: string | number): Observable<NatureDepense> {
    return this.api.getById<NatureDepense>(this.endpoint, id);
  }

  create(data: Partial<NatureDepense>): Observable<NatureDepense> {
    return this.api.post<NatureDepense>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<NatureDepense>): Observable<NatureDepense> {
    return this.api.put<NatureDepense>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
