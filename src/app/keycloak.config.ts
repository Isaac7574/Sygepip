import { KeycloakConfig } from 'keycloak-js';

export const keycloakConfig: KeycloakConfig = {
  url: 'http://172.21.224.1:8180',  // Keycloak server
  realm: 'sygepip',
  clientId: 'sygepip-frontend',
};
