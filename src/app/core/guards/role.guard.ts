import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const roleGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const requiredRoles = route.data?.['roles'] as string[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  try {
    const isLoggedIn = await keycloak.isLoggedIn();

    if (!isLoggedIn) {
      await keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    // Check if user has any of the required roles
    const userRoles = keycloak.getUserRoles();
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (hasRequiredRole) {
      return true;
    }

    // User doesn't have required role, redirect to dashboard
    router.navigate(['/admin/dashboard']);
    return false;
  } catch (error) {
    console.error('Role guard error:', error);
    router.navigate(['/admin/dashboard']);
    return false;
  }
};
