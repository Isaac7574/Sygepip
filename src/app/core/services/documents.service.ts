import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterParams, PaginatedResponse, DocumentProjet } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private api = inject(ApiService);
  private endpoint = '/documentprojet';

  getAll(params?: FilterParams): Observable<DocumentProjet[]> {
    return this.api.get<DocumentProjet[]>(this.endpoint, params);
  }

  getPaginated(params?: FilterParams): Observable<PaginatedResponse<DocumentProjet>> {
    return this.api.getPaginated<DocumentProjet>(this.endpoint, params);
  }

  getById(id: number): Observable<DocumentProjet> {
    return this.api.getById<DocumentProjet>(this.endpoint, id);
  }

  create(data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.post<DocumentProjet>(this.endpoint, data);
  }

  update(id: number, data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.put<DocumentProjet>(this.endpoint, id, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: number): Observable<DocumentProjet[]> {
    return this.api.get<DocumentProjet[]>(this.endpoint, { projetId });
  }

  getByIdeeProjet(ideeProjetId: number): Observable<DocumentProjet[]> {
    return this.api.get<DocumentProjet[]>(this.endpoint, { ideeProjetId });
  }

  upload(file: File, data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.upload(this.endpoint, file, data);
  }

  download(id: number): Observable<Blob> {
    return this.api.download(`${this.endpoint}/${id}/download`);
  }
}
