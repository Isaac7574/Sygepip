import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  try {
    const isLoggedIn = await keycloak.isLoggedIn();

    if (isLoggedIn) {
      return true;
    }

    // Redirect to Keycloak login
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  } catch (error) {
    console.error('Auth guard error:', error);
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
