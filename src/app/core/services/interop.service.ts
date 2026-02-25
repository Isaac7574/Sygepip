import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class InteropService {
  private api = inject(ApiService);
  private endpoint = '/interop';

  // Health check du service d'interopérabilité
  healthCheck(): Observable<{ status: string }> {
    return this.api.get<{ status: string }>(`${this.endpoint}/health`);
  }

  // Tester la connexion aux SI externes
  testConnexion(): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/test-connexion`);
  }

  // ============================================
  // CIFE (Financements Extérieurs)
  // ============================================

  // Synchroniser les financements extérieurs pour un projet
  synchroniserFinancementsExterieurs(projetId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/cife/financements-exterieurs/${projetId}`);
  }

  // Recevoir un webhook CIFE
  recevoirWebhookCIFE(data: any): Observable<any> {
    return this.api.post<any>(`${this.endpoint}/cife/webhook`, data);
  }

  // ============================================
  // CID (Circuit Intégré de la Dépense)
  // ============================================

  // Exporter le PIP vers le CID
  exporterVersCID(pipAnnuelId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/cid/export-pip/${pipAnnuelId}`);
  }

  // Recevoir un webhook CID
  recevoirWebhookCID(data: any): Observable<any> {
    return this.api.post<any>(`${this.endpoint}/cid/webhook`, data);
  }

  // ============================================
  // SIGASPE (Personnel)
  // ============================================

  // Synchroniser le personnel pour un projet
  synchroniserPersonnel(projetId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/sigaspe/personnel-projet/${projetId}`);
  }
}
