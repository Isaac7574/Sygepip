import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  DocumentProjetResponseDTO,
  TypeDocumentProjet
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class DocumentProjetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/documents-projet`;

  /**
   * Upload un document pour un projet
   */
  upload(
    file: File,
    typeDocument: TypeDocumentProjet,
    projetId: string,
    userId?: string
  ): Observable<DocumentProjetResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('typeDocument', typeDocument);
    formData.append('projetId', projetId);
    if (userId) {
      formData.append('userId', userId);
    }
    return this.http.post<DocumentProjetResponseDTO>(`${this.baseUrl}/upload`, formData);
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
   * Récupère la liste des documents d'un projet
   */
  getByProjet(projetId: string): Observable<DocumentProjetResponseDTO[]> {
    return this.http.get<DocumentProjetResponseDTO[]>(`${this.baseUrl}/projet/${projetId}`);
  }

  /**
   * Récupère la liste des documents par type
   */
  getByType(typeDocument: TypeDocumentProjet): Observable<DocumentProjetResponseDTO[]> {
    return this.http.get<DocumentProjetResponseDTO[]>(`${this.baseUrl}/type/${typeDocument}`);
  }

  /**
   * Recherche des documents par mot-clé
   */
  recherche(motCle: string): Observable<DocumentProjetResponseDTO[]> {
    const params = new HttpParams().set('motCle', motCle);
    return this.http.get<DocumentProjetResponseDTO[]>(`${this.baseUrl}/recherche`, { params });
  }

  /**
   * Récupère l'historique des versions d'un document
   */
  getVersions(projetId: string, typeDocument: TypeDocumentProjet): Observable<DocumentProjetResponseDTO[]> {
    return this.http.get<DocumentProjetResponseDTO[]>(
      `${this.baseUrl}/versions/${projetId}/${typeDocument}`
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
