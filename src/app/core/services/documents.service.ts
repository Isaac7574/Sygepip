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

  getById(id: string | number): Observable<DocumentProjet> {
    return this.api.getById<DocumentProjet>(this.endpoint, id);
  }

  create(data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.post<DocumentProjet>(this.endpoint, data);
  }

  update(id: string | number, data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.put<DocumentProjet>(this.endpoint, id, data);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.endpoint, id);
  }

  getByProjet(projetId: string | number): Observable<DocumentProjet[]> {
    return this.api.get<DocumentProjet[]>(`/upload/projet/${projetId}`);
  }

  getByIdeeProjet(ideeProjetId: string | number): Observable<DocumentProjet[]> {
    return this.api.get<DocumentProjet[]>(`/upload/idee-projet/${ideeProjetId}`);
  }

  upload(file: File, data: Partial<DocumentProjet>): Observable<DocumentProjet> {
    return this.api.upload('/upload', file, data);
  }

  download(id: string | number): Observable<Blob> {
    return this.api.download(`/upload/download/${id}`);
  }

  getTypesDocumentsStandards(): Observable<string[]> {
    return this.api.get<string[]>('/upload/types-standards');
  }
}

