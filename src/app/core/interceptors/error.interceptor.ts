import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout') ||
        req.url.includes('/auth/health') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/forgot-password');

      if (error.status === 401 && !isAuthEndpoint) {
        // Token expired or invalid (not a login attempt)
        authService.logout();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url, expired: true }
        });
      } else if (error.status === 403) {
        console.warn('Accès refusé (403):', req.url);
      } else if (error.status === 404) {
        console.warn('Ressource non trouvée (404):', req.url);
      } else if (error.status >= 500) {
        console.error('Server error:', error);
      }
      
      return throwError(() => error);
    })
  );
};
