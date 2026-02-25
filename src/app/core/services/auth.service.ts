import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, map, throwError, from, of, switchMap } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '@env/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@core/models';

const TOKEN_KEY = 'sygepip_token';
const REFRESH_TOKEN_KEY = 'sygepip_refresh_token';
const USER_KEY = 'sygepip_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private keycloak = inject(KeycloakService);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signals for reactive state
  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(this.getStoredUser());
  private _isLoading = signal(false);

  // Computed signals
  isAuthenticated = computed(() => this._isAuthenticated());
  currentUser = computed(() => this._currentUser());
  isLoading = computed(() => this._isLoading());
  isAdmin = computed(() => this.hasAnyRole(['ADMIN']));
  isManager = computed(() => this.hasAnyRole(['ADMIN', 'MANAGER']));

  constructor() {
    // Initialize auth state from Keycloak
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

  // Load user profile from Keycloak and backend
  private async loadUserProfile(): Promise<void> {
    try {
      const keycloakProfile = await this.keycloak.loadUserProfile();
      const roles = this.keycloak.getUserRoles();

      const user: User = {
        id: keycloakProfile.id || '',
        username: keycloakProfile.username || '',
        email: keycloakProfile.email || '',
        nom: keycloakProfile.lastName || '',
        prenom: keycloakProfile.firstName || '',
        roles: roles,
        role: roles.length > 0 ? roles[0] : undefined,
        actif: true
      };

      this.storeUser(user);
      this._currentUser.set(user);
      this.currentUserSubject.next(user);

      // Optionally sync with backend
      this.syncWithBackend().subscribe({
        next: (backendUser) => {
          if (backendUser) {
            const mergedUser = { ...user, ...backendUser };
            this.storeUser(mergedUser);
            this._currentUser.set(mergedUser);
            this.currentUserSubject.next(mergedUser);
          }
        },
        error: () => {} // Ignore backend sync errors
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Sync user with backend
  private syncWithBackend(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      catchError(() => of(null))
    );
  }

  // Login via Keycloak
  login(credentials?: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);

    return from(this.keycloak.login({
      redirectUri: window.location.origin + '/app/dashboard'
    })).pipe(
      map(() => ({} as LoginResponse)),
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  // Register (redirect to Keycloak registration)
  register(data?: RegisterRequest): Observable<any> {
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

  // Logout via Keycloak
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.currentUserSubject.next(null);

    this.keycloak.logout(window.location.origin + '/auth/login');
  }

  // Forgot password (redirect to Keycloak)
  forgotPassword(email?: string): Observable<any> {
    // Keycloak handles this via its own UI
    window.location.href = `${environment.keycloakUrl || 'http://localhost:8180'}/realms/sygepip/login-actions/reset-credentials`;
    return of({ success: true });
  }

  // Reset password
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  // Change password (redirect to Keycloak account page)
  changePassword(currentPassword?: string, newPassword?: string): Observable<any> {
    window.location.href = `${environment.keycloakUrl || 'http://localhost:8180'}/realms/sygepip/account/password`;
    return of({ success: true });
  }

  // Update profile
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

  // Refresh token via Keycloak
  refreshToken(): Observable<string> {
    return from(this.keycloak.updateToken(30)).pipe(
      switchMap(() => from(this.keycloak.getToken())),
      map(token => token || ''),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  // Get current user from API
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(user => {
          this.storeUser(user);
          this._currentUser.set(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  // Check if user has role
  hasRole(roles: string | string[]): boolean {
    const expected = Array.isArray(roles) ? roles : [roles];
    return this.hasAnyRole(expected);
  }

  // Get Keycloak roles
  getKeycloakRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  // Get token from Keycloak (synchronous - returns cached token)
  getToken(): string | null {
    try {
      // KeycloakService stores the token after authentication
      const keycloakInstance = (this.keycloak as any)._keycloak;
      if (keycloakInstance && keycloakInstance.token) {
        return keycloakInstance.token;
      }
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return localStorage.getItem(TOKEN_KEY);
    }
  }

  // Get token as Observable
  getTokenAsync(): Observable<string> {
    return from(this.keycloak.getToken()).pipe(
      map(token => token || '')
    );
  }

  // Check if logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.keycloak.isLoggedIn();
    } catch {
      return false;
    }
  }

  // Private methods
  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private storeRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
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
    // First check Keycloak roles
    const keycloakRoles = this.keycloak.getUserRoles();
    if (keycloakRoles.length > 0) {
      return expectedRoles.some(role => keycloakRoles.includes(role));
    }

    // Fallback to stored user roles
    const user = this._currentUser();
    if (!user) {
      return false;
    }

    const resolvedRoles = user.roles ?? (user.role ? [user.role] : []);
    return expectedRoles.some(role => resolvedRoles.includes(role));
  }
}
