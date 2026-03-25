import { KeycloakConfig } from 'keycloak-js';

export const keycloakConfig: KeycloakConfig = {

  url: 'http://localhost:8180',
  //url: 'http://192.168.11.82:8180',
  realm: 'sygepip',
  clientId: 'sygepip-frontend',
};
