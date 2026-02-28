import { KeycloakConfig } from 'keycloak-js';

export const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8180',  // Keycloak server
  realm: 'sygepip',
  clientId: 'sygepip-frontend',
};
