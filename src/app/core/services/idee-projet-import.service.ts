import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IdeeProjetImportInfosGeneralesPayload, IdeeProjetImportResult } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class IdeeProjetImportService {
  private api = inject(ApiService);
  private endpoint = '/ideeprojet/import';

  importInfosGenerales(
    file: File,
    payload: IdeeProjetImportInfosGeneralesPayload
  ): Observable<IdeeProjetImportResult> {
    return this.api.upload<IdeeProjetImportResult>(`${this.endpoint}/infos-generales`, file, payload);
  }

  importNoteConceptuelle(file: File): Observable<IdeeProjetImportResult> {
    return this.api.upload<IdeeProjetImportResult>(`${this.endpoint}/note-conceptuelle`, file);
  }
}
