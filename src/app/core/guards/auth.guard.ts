import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);

  try {
    const isLoggedIn = await keycloak.isLoggedIn();

    if (isLoggedIn) {
      return true;
    }

    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  } catch (error) {
    console.error('Auth guard error:', error);
    await keycloak.login({
      redirectUri: window.location.origin + '/app/dashboard'
    });
    return false;
  }
};
