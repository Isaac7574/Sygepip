import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FilterParams, WorkflowEtape } from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private api = inject(ApiService);
  private etapesEndpoint = '/workflowetape';
  private workflowEndpoint = '/workflow';

  getAll(params?: FilterParams): Observable<WorkflowEtape[]> {
    return this.api
      .get<WorkflowEtape[]>(this.etapesEndpoint, params)
      .pipe(map(items => items.map(item => this.adaptFromApi(item))));
  }

  getById(id: string | number): Observable<WorkflowEtape> {
    return this.api
      .getById<WorkflowEtape>(this.etapesEndpoint, id)
      .pipe(map(item => this.adaptFromApi(item)));
  }

  create(data: Partial<WorkflowEtape>): Observable<WorkflowEtape> {
    return this.api
      .post<WorkflowEtape>(this.etapesEndpoint, this.adaptToApi(data))
      .pipe(map(item => this.adaptFromApi(item)));
  }

  update(id: string | number, data: Partial<WorkflowEtape>): Observable<WorkflowEtape> {
    return this.api
      .put<WorkflowEtape>(this.etapesEndpoint, id, this.adaptToApi(data))
      .pipe(map(item => this.adaptFromApi(item)));
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(this.etapesEndpoint, id);
  }

  getByModule(module: string): Observable<WorkflowEtape[]> {
    return this.getAll({ module });
  }

  getInfo(): Observable<string> {
    return this.api.get<string>(this.workflowEndpoint);
  }

  getHistorique(entiteType: string, entiteId: string | number): Observable<any[]> {
    return this.api.get<any[]>(`${this.workflowEndpoint}/historique`, { entiteType, entiteId });
  }

  getEtapesDisponibles(module: string, etatActuel: string): Observable<WorkflowEtape[]> {
    return this.api
      .get<WorkflowEtape[]>(`${this.workflowEndpoint}/etapes-disponibles`, { module, etatActuel })
      .pipe(map(items => items.map(item => this.adaptFromApi(item))));
  }

  executeTransition(payload: {
    entiteType: string;
    entiteId: string;
    codeEtape: string;
    userId: string;
    commentaire?: string;
  }): Observable<boolean> {
    const params = new URLSearchParams({
      entiteType: payload.entiteType,
      entiteId: payload.entiteId,
      codeEtape: payload.codeEtape,
      userId: payload.userId
    });
    if (payload.commentaire) {
      params.set('commentaire', payload.commentaire);
    }

    return this.api.post<boolean>(`${this.workflowEndpoint}/transition?${params.toString()}`, {});
  }

  initialiserMaturation(): Observable<void> {
    return this.api.post<void>(`${this.workflowEndpoint}/initialiser/maturation`, {});
  }

  initialiserPIP(): Observable<void> {
    return this.api.post<void>(`${this.workflowEndpoint}/initialiser/pip`, {});
  }

  initialiserSuivi(): Observable<void> {
    return this.api.post<void>(`${this.workflowEndpoint}/initialiser/suivi`, {});
  }

  private adaptFromApi(item: WorkflowEtape): WorkflowEtape {
    return {
      ...item,
      roleValidateur: item.roleValidateur ?? item.roleRequis
    };
  }

  private adaptToApi(data: Partial<WorkflowEtape>): Partial<WorkflowEtape> {
    return {
      module: data.module,
      codeEtape: data.codeEtape,
      nomEtape: data.nomEtape,
      ordre: data.ordre,
      etatSource: data.etatSource,
      etatCible: data.etatCible,
      roleRequis: data.roleRequis ?? data.roleValidateur,
      notificationEmail: data.notificationEmail,
      actif: data.actif
    };
  }
}

