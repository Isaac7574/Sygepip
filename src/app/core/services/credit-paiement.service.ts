import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreditPaiement, FilterParams, PaginatedResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CreditPaiementService {
  private api = inject(ApiService);
  private endpoint = '/creditpaiement';

  getAll(params?: FilterParams): Observable<CreditPaiement[]> {
    return this.api.get<CreditPaiement[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<CreditPaiement>> {
    return this.api.getPaginated<CreditPaiement>(this.endpoint, params);
  }

  getById(id: string | number): Observable<CreditPaiement> {
    return this.api.getById<CreditPaiement>(this.endpoint, id);
  }

  create(data: Partial<CreditPaiement>): Observable<CreditPaiement> {
    return this.api.post<CreditPaiement>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<CreditPaiement>): Observable<CreditPaiement> {
    return this.api.put<CreditPaiement>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }
}

