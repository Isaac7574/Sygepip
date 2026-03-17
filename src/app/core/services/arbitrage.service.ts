import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ArbitrageProjetRequestDTO, ArbitrageProjetResponseDTO } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ArbitrageService {
  private api = inject(ApiService);
  private endpoint = '/arbitrage/projet';

  arbitrerProjet(projetId: string, payload: ArbitrageProjetRequestDTO): Observable<ArbitrageProjetResponseDTO> {
    return this.api.post<ArbitrageProjetResponseDTO>(`${this.endpoint}/${projetId}`, payload);
  }
}
