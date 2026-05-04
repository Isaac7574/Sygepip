import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PlanFinancementIdeeProjet, PlanFinancementIdeeProjetPayload } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class PlanFinancementIdeeProjetService {
  private api = inject(ApiService);
  private endpoint = '/ideeprojet';

  getAll(ideeId: string | number, actif?: boolean): Observable<PlanFinancementIdeeProjet[]> {
    return this.api.get<PlanFinancementIdeeProjet[]>(
      `${this.endpoint}/${ideeId}/plan-financement`,
      actif === undefined ? undefined : { actif }
    );
  }

  getById(ideeId: string | number, id: string | number): Observable<PlanFinancementIdeeProjet> {
    return this.api.getById<PlanFinancementIdeeProjet>(`${this.endpoint}/${ideeId}/plan-financement`, id);
  }

  create(ideeId: string | number, data: PlanFinancementIdeeProjetPayload): Observable<PlanFinancementIdeeProjet> {
    return this.api.post<PlanFinancementIdeeProjet>(`${this.endpoint}/${ideeId}/plan-financement`, data);
  }

  update(ideeId: string | number, id: string | number, data: PlanFinancementIdeeProjetPayload): Observable<PlanFinancementIdeeProjet> {
    return this.api.putUrl<PlanFinancementIdeeProjet>(`${this.endpoint}/${ideeId}/plan-financement/${id}`, data);
  }

  delete(ideeId: string | number, id: string | number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${ideeId}/plan-financement`, id);
  }
}
