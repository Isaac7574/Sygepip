import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Media, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class MediasService {
  private api = inject(ApiService);
  private endpoint = '/media';

  getAll(params?: FilterParams): Observable<Media[]> {
    return this.api.get<Media[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<Media>> {
    return this.api.getPaginated<Media>(this.endpoint, params);
  }

  getById(id: number): Observable<Media> {
    return this.api.getById<Media>(this.endpoint, id);
  }

  create(data: Partial<Media>): Observable<Media> {
    return this.api.post<Media>(this.endpoint, data);
  }

  update(id: number, data: Partial<Media>): Observable<Media> {
    return this.api.put<Media>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
