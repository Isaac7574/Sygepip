import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AbacRule,
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

  // Liste des endpoints disponibles pour l'ABAC
  getAbacEndpoints(): Observable<string[]> {
    return this.api.get<string[]>('/admin/abac-endpoints');
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
