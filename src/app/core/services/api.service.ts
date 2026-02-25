import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { FilterParams, PaginatedResponse } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // GET request
  get<T>(endpoint: string, params?: FilterParams): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  // GET paginated
  getPaginated<T>(endpoint: string, params?: FilterParams): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  // GET by ID
  getById<T>(endpoint: string, id: string | number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // POST request
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  // PUT request with id
  put<T>(endpoint: string, id: string | number, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}/${id}`, body)
      .pipe(catchError(this.handleError));
  }

  // PUT request to full endpoint (without id concatenation)
  putUrl<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  // PATCH request
  patch<T>(endpoint: string, id: string | number, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}/${id}`, body)
      .pipe(catchError(this.handleError));
  }

  // DELETE request
  delete<T>(endpoint: string, id: string | number): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // DELETE request with body
  deleteWithBody<T>(endpoint: string, body?: any): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { body })
      .pipe(catchError(this.handleError));
  }

  // Upload file
  upload(endpoint: string, file: File, additionalData?: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post(`${this.baseUrl}${endpoint}`, formData)
      .pipe(catchError(this.handleError));
  }

  // Download file
  download(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Build HTTP params
  private buildParams(params?: FilterParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return httpParams;
  }

  // Error handler
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = 'Accès non autorisé.';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

