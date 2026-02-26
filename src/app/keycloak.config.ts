import { KeycloakConfig } from 'keycloak-js';

export const keycloakConfig: KeycloakConfig = {
  url: 'http://192.168.11.113:8180',  // Keycloak server
  realm: 'sygepip',
  clientId: 'sygepip-frontend',
};
