import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { environment } from '@env/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@core/models';

const TOKEN_KEY = 'sygepip_token';
const USER_KEY = 'sygepip_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signals for reactive state
  private _isAuthenticated = signal(this.hasValidToken());
  private _currentUser = signal<User | null>(this.getStoredUser());
  private _isLoading = signal(false);
  
  // Computed signals
  isAuthenticated = computed(() => this._isAuthenticated());
  currentUser = computed(() => this._currentUser());
  isLoading = computed(() => this._isLoading());
  isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  isManager = computed(() => ['ADMIN', 'MANAGER'].includes(this._currentUser()?.role || ''));

  // Login
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          const token = this.extractToken(response);
          if (!token) {
            throw new Error('Aucun token JWT trouvé dans la réponse du serveur');
          }
          this.storeToken(token);
          const user = response.userInfo || response.user || null;
          if (user) {
            this.storeUser(user);
          }
          this._isAuthenticated.set(true);
          this._currentUser.set(user);
          this.currentUserSubject.next(user);
          this._isLoading.set(false);
        }),
        catchError(error => {
          this._isLoading.set(false);
          throw error;
        })
      );
  }

  private extractToken(response: LoginResponse): string | null {
    const token = response.token || response.accessToken || response.access_token || response.jwt;
    if (token && token.includes('.')) {
      return token;
    }
    // Fallback: search all string values that look like a JWT
    for (const value of Object.values(response)) {
      if (typeof value === 'string' && value.split('.').length === 3 && value.length > 20) {
        return value;
      }
    }
    return null;
  }

  // Register
  register(data: RegisterRequest): Observable<any> {
    this._isLoading.set(true);
    
    return this.http.post(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(() => this._isLoading.set(false)),
        catchError(error => {
          this._isLoading.set(false);
          throw error;
        })
      );
  }

  // Logout
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  // Reset password
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword });
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

  // Refresh token
  refreshToken(): Observable<string> {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth/refresh-token`, {})
      .pipe(
        tap(response => this.storeToken(response.token)),
        map(response => response.token)
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
    const userRole = this._currentUser()?.role;
    if (!userRole) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Private methods
  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
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

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired (basic JWT check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
}
