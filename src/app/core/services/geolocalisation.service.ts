import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LocaliteIntervention, FilterParams } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocalisationService {
  private api = inject(ApiService);
  private endpoint = '/geolocalisation';

  // Récupérer les projets dans une zone géographique
  getProjetsParZone(minLat: number, maxLat: number, minLon: number, maxLon: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.endpoint}/zone`, { minLat, maxLat, minLon, maxLon });
  }

  // Récupérer les projets par région
  getProjetsParRegion(regionId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/region/${regionId}`);
  }

  // Récupérer les localités d'un projet
  getLocalitesProjet(projetId: string): Observable<LocaliteIntervention[]> {
    return this.api.get<LocaliteIntervention[]>(`${this.endpoint}/localites/projet/${projetId}`);
  }

  // Ajouter une localité géolocalisée
  ajouterLocalite(
    projetId: string,
    nomLocalite: string,
    latitude: number,
    longitude: number,
    typeLocalite: string
  ): Observable<LocaliteIntervention> {
    return this.api.post<LocaliteIntervention>(`${this.endpoint}/localites`, {
      projetId,
      nomLocalite,
      latitude,
      longitude,
      typeLocalite
    });
  }

  // Générer un GeoJSON pour un PIP annuel
  genererGeoJSON(pipAnnuelId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/geojson/${pipAnnuelId}`);
  }

  // Générer une heatmap pour un PIP annuel
  genererHeatmap(pipAnnuelId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/heatmap/${pipAnnuelId}`);
  }

  // Récupérer les statistiques géographiques pour un PIP annuel
  getStatistiquesGeographiques(pipAnnuelId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistiques/${pipAnnuelId}`);
  }

  // Calculer la distance entre deux points
  calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/distance`, { lat1, lon1, lat2, lon2 });
  }
}
