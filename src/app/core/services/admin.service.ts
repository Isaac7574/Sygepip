import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AbacRule,
  AbacMinistere,
  AbacDirection,
  AbacEndpointsPageDTO,
  KeycloakUser,
  KeycloakUserCreateRequest,
  UserRegistrationRequest,
  UserRegistrationResponse,
  FilterParams
} from '@core/models';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = inject(ApiService);

  // ============================================
  // ABAC ENDPOINTS
  // ============================================

  // Liste des endpoints disponibles pour l'ABAC (paginée)
  getAbacEndpoints(page: number = 0, size: number = 50): Observable<AbacEndpointsPageDTO> {
    return this.api.get<AbacEndpointsPageDTO>('/admin/abac-endpoints', { page, size });
  }

  // Liste des ministères (nettoyée) pour l'ABAC
  getAbacMinisteres(actif: boolean = true): Observable<AbacMinistere[]> {
    return this.api.get<AbacMinistere[]>('/admin/abac-ministeres', { actif });
  }

  // Liste des directions (nettoyée) pour l'ABAC
  getAbacDirections(params?: { ministereId?: string; actif?: boolean }): Observable<AbacDirection[]> {
    const query = {
      actif: params?.actif ?? true,
      ...(params?.ministereId ? { ministereId: params.ministereId } : {})
    };
    return this.api.get<AbacDirection[]>('/admin/abac-ministeres/directions', query);
  }

  // ============================================
  // ABAC RULES
  // ============================================

  // Lister toutes les règles ABAC
  getAbacRules(params?: FilterParams): Observable<AbacRule[]> {
    return this.api.get<AbacRule[]>('/admin/abac-rules', params);
  }

  // Récupérer une règle ABAC par ID
  getAbacRuleById(id: string): Observable<AbacRule> {
    return this.api.getById<AbacRule>('/admin/abac-rules', id);
  }

  // Créer une règle ABAC
  createAbacRule(data: Partial<AbacRule>): Observable<AbacRule> {
    return this.api.post<AbacRule>('/admin/abac-rules', data);
  }

  // Mettre à jour une règle ABAC
  updateAbacRule(id: string, data: Partial<AbacRule>): Observable<AbacRule> {
    return this.api.put<AbacRule>('/admin/abac-rules', id, data);
  }

  // Supprimer une règle ABAC
  deleteAbacRule(id: string): Observable<void> {
    return this.api.delete<void>('/admin/abac-rules', id);
  }

  // ============================================
  // KEYCLOAK USERS
  // ============================================

  // Lister les utilisateurs Keycloak
  getKeycloakUsers(): Observable<KeycloakUser[]> {
    return this.api.get<KeycloakUser[]>('/admin/keycloak/users');
  }

  // Créer un utilisateur Keycloak
  createKeycloakUser(data: KeycloakUserCreateRequest): Observable<KeycloakUser> {
    return this.api.post<KeycloakUser>('/admin/keycloak/users', data);
  }

  // Mettre à jour les rôles d'un utilisateur Keycloak
  updateKeycloakUserRoles(id: string, roles: string[]): Observable<void> {
    return this.api.putUrl<void>(`/admin/keycloak/users/${id}/roles`, roles);
  }

  // ============================================
  // USER REGISTRATION (Keycloak + base locale)
  // ============================================

  // Inscrire un utilisateur (Keycloak + base locale)
  registerUser(data: UserRegistrationRequest): Observable<UserRegistrationResponse> {
    return this.api.post<UserRegistrationResponse>('/admin/users/register', data);
  }
}
