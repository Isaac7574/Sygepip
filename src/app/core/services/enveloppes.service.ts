import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnveloppeReference, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class EnveloppesService {
  private api = inject(ApiService);
  private endpoint = '/enveloppereference';

  getAll(params?: FilterParams): Observable<EnveloppeReference[]> {
    return this.api.get<EnveloppeReference[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<EnveloppeReference>> {
    return this.api.getPaginated<EnveloppeReference>(this.endpoint, params);
  }

  getById(id: number): Observable<EnveloppeReference> {
    return this.api.getById<EnveloppeReference>(this.endpoint, id);
  }

  create(data: Partial<EnveloppeReference>): Observable<EnveloppeReference> {
    return this.api.post<EnveloppeReference>(this.endpoint, data);
  }

  update(id: number, data: Partial<EnveloppeReference>): Observable<EnveloppeReference> {
    return this.api.put<EnveloppeReference>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByPipAnnuel(pipAnnuelId: number): Observable<EnveloppeReference[]> {
    return this.api.get<EnveloppeReference[]>(this.endpoint, { pipAnnuelId });
  }

  getByMinistere(ministereId: number): Observable<EnveloppeReference[]> {
    return this.api.get<EnveloppeReference[]>(this.endpoint, { ministereId });
  }
}
