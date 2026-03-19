import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap, catchError, throwError } from 'rxjs';

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
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Authentication Required',
        url: req.url,
        error: { message: 'Authentification Keycloak indisponible ou token manquant.' }
      }));
    }),
    catchError(() => {
      const storedToken = localStorage.getItem('sygepip_token');
      if (!storedToken) {
        return throwError(() => new HttpErrorResponse({
          status: 401,
          statusText: 'Authentication Required',
          url: req.url,
          error: { message: 'Session non initialisee. Rechargez l\'application ou reconnectez-vous.' }
        }));
      }

      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${storedToken}`
        }
      });
      return next(clonedReq);
    })
  );
};
