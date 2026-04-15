import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  catchError,
  map,
  throwError,
  from,
  of,
  switchMap,
  firstValueFrom
} from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '@env/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@core/models';

const TOKEN_KEY = 'sygepip_token';
const USER_KEY = 'sygepip_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private keycloak = inject(KeycloakService);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(this.getStoredUser());
  private _isLoading = signal(false);

  isAuthenticated = computed(() => this._isAuthenticated());
  currentUser = computed(() => this._currentUser());
  isLoading = computed(() => this._isLoading());
  isAdmin = computed(() => this.hasAnyRole(['ADMIN']));
  isManager = computed(() => this.hasAnyRole(['ADMIN', 'MANAGER']));

  constructor() {
    this.initializeAuthState();
  }

  private async initializeAuthState(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloak.isLoggedIn();
      this._isAuthenticated.set(isLoggedIn);

      if (isLoggedIn) {
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this._isAuthenticated.set(false);
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const token = await this.keycloak.getToken();
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }

      const keycloakProfile = await this.keycloak.loadUserProfile();
      const roles = this.keycloak.getUserRoles();
      const backendUser = await this.loadCurrentUserByKeycloak();

      const user: User = {
        id: backendUser?.id || keycloakProfile.id || '',
        username: backendUser?.username || keycloakProfile.username || '',
        email: backendUser?.email || keycloakProfile.email || '',
        nom: backendUser?.nom || keycloakProfile.lastName || '',
        prenom: backendUser?.prenom || keycloakProfile.firstName || '',
        telephone: backendUser?.telephone,
        role: backendUser?.role || (roles.length > 0 ? roles[0] : undefined),
        roles: roles.length > 0 ? roles : (backendUser?.role ? [backendUser.role] : []),
        ministereId: backendUser?.ministereId,
        directionId: backendUser?.directionId,
        typeAffiliation: backendUser?.typeAffiliation,
        organisationExterne: backendUser?.organisationExterne,
        actif: backendUser?.actif ?? true,
        createdAt: backendUser?.createdAt,
        updatedAt: backendUser?.updatedAt
      };

      this.storeUser(user);
      this._currentUser.set(user);
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  private async loadCurrentUserByKeycloak(): Promise<User | null> {
    try {
      return await firstValueFrom(this.http.get<User>(`${environment.apiUrl}/me/keycloak`));
    } catch (error) {
      console.warn('Unable to load current user via /me/keycloak:', error);
      return null;
    }
  }

  login(_credentials?: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);

    return from(this.keycloak.login({
      redirectUri: window.location.origin + '/app/dashboard',
      locale: 'fr'
    })).pipe(
      map(() => ({} as LoginResponse)),
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  register(_data?: RegisterRequest): Observable<any> {
    this._isLoading.set(true);

    return from(this.keycloak.register({
      redirectUri: window.location.origin + '/app/dashboard'
    })).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.currentUserSubject.next(null);

    this.keycloak.logout(window.location.origin + '/');
  }

  forgotPassword(_email?: string): Observable<any> {
    window.location.href = `${environment.keycloakUrl || 'http://192.168.11.106:8180'}/realms/sygepip/login-actions/reset-credentials`;
    return of({ success: true });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  changePassword(_currentPassword?: string, _newPassword?: string): Observable<any> {
    window.location.href = `${environment.keycloakUrl || 'http://192.168.11.106:8180'}/realms/sygepip/account/password`;
    return of({ success: true });
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/auth/profile`, data)
      .pipe(
        tap(user => {
          this.storeUser(user);
          this._currentUser.set(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  refreshToken(): Observable<string> {
    return from(this.keycloak.updateToken(30)).pipe(
      switchMap(() => from(this.keycloak.getToken())),
      map(token => {
        const resolvedToken = token || '';
        if (resolvedToken) {
          localStorage.setItem(TOKEN_KEY, resolvedToken);
        }
        return resolvedToken;
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  getCurrentUser(): Observable<User> {
    const user = this._currentUser();
    if (user) {
      return of(user);
    }
    return throwError(() => new Error('Utilisateur non disponible'));
  }

  hasRole(roles: string | string[]): boolean {
    const expected = Array.isArray(roles) ? roles : [roles];
    return this.hasAnyRole(expected);
  }

  getKeycloakRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  getToken(): string | null {
    try {
      const keycloakInstance = (this.keycloak as any)._keycloak;
      if (keycloakInstance && keycloakInstance.token) {
        return keycloakInstance.token;
      }
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return localStorage.getItem(TOKEN_KEY);
    }
  }

  getTokenSubject(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
      const payload = JSON.parse(atob(padded)) as { sub?: string };
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  getTokenAsync(): Observable<string> {
    return from(this.keycloak.getToken()).pipe(
      map(token => token || '')
    );
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.keycloak.isLoggedIn();
    } catch {
      return false;
    }
  }

  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private hasAnyRole(expectedRoles: string[]): boolean {
    const keycloakRoles = this.keycloak.getUserRoles();
    if (keycloakRoles.length > 0) {
      return expectedRoles.some(role => keycloakRoles.includes(role));
    }

    const user = this._currentUser();
    if (!user) {
      return false;
    }

    const resolvedRoles = user.roles ?? (user.role ? [user.role] : []);
    return expectedRoles.some(role => resolvedRoles.includes(role));
  }
}
