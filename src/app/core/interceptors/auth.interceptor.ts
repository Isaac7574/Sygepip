import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap, catchError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);

  // Skip auth header for public endpoints and assets
  const publicEndpoints = [
    '/assets',
    '/auth/login',
    '/auth/refresh',
    '/auth/health',
    '/auth/register',
    '/auth/forgot-password'
  ];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublicEndpoint) {
    return next(req);
  }

  // Get token from Keycloak and add to request
  return from(keycloak.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }
      return next(req);
    }),
    catchError(() => {
      // If Keycloak fails, try from localStorage (fallback)
      const storedToken = localStorage.getItem('sygepip_token');
      if (storedToken) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        return next(clonedReq);
      }
      return next(req);
    })
  );
};
