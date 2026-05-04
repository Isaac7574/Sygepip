import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DossierProjetIdee } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DossierProjetIdeeService {
  private api = inject(ApiService);
  private endpoint = '/ideeprojet';

  getDossier(ideeId: string | number): Observable<DossierProjetIdee> {
    return this.api.get<DossierProjetIdee>(`${this.endpoint}/${ideeId}/dossier-projet`);
  }

  synchroniser(ideeId: string | number): Observable<DossierProjetIdee> {
    return this.api.post<DossierProjetIdee>(`${this.endpoint}/${ideeId}/dossier-projet/synchroniser`, {});
  }

  validerDirectement(ideeId: string | number): Observable<DossierProjetIdee> {
    return this.api.post<DossierProjetIdee>(`${this.endpoint}/${ideeId}/dossier-projet/valider`, {});
  }
}
