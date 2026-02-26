import { APP_INITIALIZER, Provider } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { keycloakConfig } from './app/keycloak.config';

// Keycloak initialization function
function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    const keycloakInit = keycloak.init({
      config: keycloakConfig,
      initOptions: {
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
      },
      enableBearerInterceptor: true,
      bearerExcludedUrls: [
        '/assets',
        '/auth/login',
        '/auth/refresh',
        '/auth/health',
        '/auth/register',
        '/auth/forgot-password'
      ]
    }).catch((err: unknown) => {
      console.warn('Keycloak initialization failed:', err);
    });

    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn('Keycloak init timeout — serveur inaccessible, démarrage sans authentification');
        resolve();
      }, 5000)
    );

    return Promise.race([keycloakInit, timeout]);
  };
}

// Keycloak providers
const keycloakProviders: Provider[] = [
  KeycloakService,
  {
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService]
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: KeycloakBearerInterceptor,
    multi: true
  }
];

bootstrapApplication(AppComponent, {
  providers: [
    ...keycloakProviders,
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimations()
  ]
}).catch(err => console.error('Erreur de démarrage:', err));
