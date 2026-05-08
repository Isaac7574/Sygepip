import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { GeoJsonFeatureCollection } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getCarteRegions(cibleId?: string) {
    return this.api.get<GeoJsonFeatureCollection>('/dashboard/carte/regions', {
      cibleId
    });
  }

  getCarteProvinces(regionId?: string, cibleId?: string) {
    return this.api.get<GeoJsonFeatureCollection>('/dashboard/carte/provinces', {
      regionId,
      cibleId
    });
  }

  getCarteCommunes(provinceId?: string, cibleId?: string) {
    return this.api.get<GeoJsonFeatureCollection>('/dashboard/carte/communes', {
      provinceId,
      cibleId
    });
  }
}
