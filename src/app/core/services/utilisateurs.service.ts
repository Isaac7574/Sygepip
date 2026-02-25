import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  private api = inject(ApiService);
  private endpoint = '/utilisateur';

  getAll(params?: FilterParams): Observable<User[]> {
    return this.api.get<User[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<User>> {
    return this.api.getPaginated<User>(this.endpoint, params);
  }

  getById(id: number): Observable<User> {
    return this.api.getById<User>(this.endpoint, id);
  }

  create(data: Partial<User>): Observable<User> {
    return this.api.post<User>(this.endpoint, data);
  }

  update(id: number, data: Partial<User>): Observable<User> {
    return this.api.put<User>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}
