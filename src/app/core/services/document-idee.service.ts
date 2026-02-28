import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  DocumentIdeeProjetResponseDTO,
  TypeDocumentProjet
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class DocumentIdeeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/documents-idee`;

  /**
   * Upload un document pour une idée de projet
   */
  upload(
    file: File,
    typeDocument: TypeDocumentProjet,
    ideeProjetId: string,
    userId?: string
  ): Observable<DocumentIdeeProjetResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('typeDocument', typeDocument);
    formData.append('ideeProjetId', ideeProjetId);
    if (userId) {
      formData.append('userId', userId);
    }
    return this.http.post<DocumentIdeeProjetResponseDTO>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Télécharge un document par son ID
   */
  download(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, {
      responseType: 'blob'
    });
  }

  /**
   * Récupère la liste des documents d'une idée de projet
   */
  getByIdeeProjet(ideeProjetId: string): Observable<DocumentIdeeProjetResponseDTO[]> {
    return this.http.get<DocumentIdeeProjetResponseDTO[]>(`${this.baseUrl}/idee/${ideeProjetId}`);
  }

  /**
   * Récupère la liste des documents par type
   */
  getByType(typeDocument: TypeDocumentProjet): Observable<DocumentIdeeProjetResponseDTO[]> {
    return this.http.get<DocumentIdeeProjetResponseDTO[]>(`${this.baseUrl}/type/${typeDocument}`);
  }

  /**
   * Recherche des documents par mot-clé
   */
  recherche(motCle: string): Observable<DocumentIdeeProjetResponseDTO[]> {
    const params = new HttpParams().set('motCle', motCle);
    return this.http.get<DocumentIdeeProjetResponseDTO[]>(`${this.baseUrl}/recherche`, { params });
  }

  /**
   * Récupère l'historique des versions d'un document
   */
  getVersions(ideeProjetId: string, typeDocument: TypeDocumentProjet): Observable<DocumentIdeeProjetResponseDTO[]> {
    return this.http.get<DocumentIdeeProjetResponseDTO[]>(
      `${this.baseUrl}/versions/${ideeProjetId}/${typeDocument}`
    );
  }

  /**
   * Suppression logique d'un document
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Télécharge un fichier et déclenche le téléchargement dans le navigateur
   */
  downloadAndSave(id: string, filename: string): void {
    this.download(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Erreur lors du téléchargement:', err)
    });
  }
}
