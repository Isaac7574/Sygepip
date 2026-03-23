# Menus et Endpoints Implémentés

Ce document liste les menus et endpoints backend branchés ou modifiés côté frontend dans ce projet.

## Référentiels

### Bénéficiaires
- Menu : `Référentiels > Bénéficiaires`
- Route frontend : `/app/referentiels/beneficiaires`
- Composant : [beneficiaires.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/referentiels/beneficiaires/beneficiaires.component.ts)
- Service : [cibles.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/cibles.service.ts)

Endpoints utilisés :
- `GET /api/cible`
- `GET /api/cible/{id}`
- `POST /api/cible`
- `PUT /api/cible/{id}`
- `DELETE /api/cible/{id}`

Payload création / mise à jour attendu côté front :
```json
{
  "libelle": "Femmes",
  "description": "Description optionnelle",
  "quantiteEstimee": 1500,
  "actif": true
}
```

## Maturation

### Idées de projet
- Menu : `Maturation > Idées de Projet`
- Route frontend : `/app/maturation/idees-projet`
- Composant : [idees-projet.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/maturation/idees-projet/idees-projet.component.ts)
- Service : [idees-projet.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/idees-projet.service.ts)

Endpoints utilisés :
- `GET /api/ideeprojet`
- `GET /api/ideeprojet/{id}`
- `POST /api/ideeprojet`
- `PUT /api/ideeprojet/{id}`
- `DELETE /api/ideeprojet/{id}`
- `GET /api/ideeprojet/{id}/note-conceptuelle`
- `PUT /api/ideeprojet/{id}/note-conceptuelle`
- `GET /api/cible`

### Note conceptuelle
- Accès : depuis la liste des idées de projet
- Données chargées à l’ouverture :
  - `GET /api/cible`
  - `GET /api/ideeprojet/{id}/note-conceptuelle`

Sauvegarde :
- `PUT /api/ideeprojet/{id}/note-conceptuelle`

Payload actuellement envoyé :
```json
{
  "ideeProjetId": "uuid",
  "contexte": "...",
  "alignementStrategique": "...",
  "cibleIds": ["uuid1", "uuid2"],
  "resultatsAttendus": "...",
  "indicateursPreliminaires": "...",
  "descriptionSolution": "...",
  "composantesProjet": "...",
  "approcheMiseEnOeuvre": "...",
  "contraintesRisques": "...",
  "hypotheses": "...",
  "prerequis": "...",
  "beneficiairesEstimes": 1000,
  "coutEstime": 25000000,
  "sourcesFinancementEnvisagees": "...",
  "dureeEstimeeMois": 12,
  "chronogrammeSynthese": "...",
  "impactSocioEconomique": "...",
  "impactEnvironnementalSocial": "...",
  "durabilite": "..."
}
```

Comportement UI implémenté :
- sélection de bénéficiaires via liste déroulante custom
- affichage des bénéficiaires sélectionnés sous forme de tags
- suppression d’un bénéficiaire via bouton rouge `x`

### Détail d’une idée de projet
- Route frontend : `/app/maturation/idees-projet/:ididee`
- Composant : [idee-projet-detail.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/maturation/idee-projet-detail/idee-projet-detail.component.ts)

Endpoints utilisés :
- `GET /api/ideeprojet/{id}`
- `GET /api/ideeprojet/{id}/note-conceptuelle`
- `GET /api/cible`
- `GET /api/documents-idee/idee/{ideeProjetId}`

### Workflow Maturation
Service : [idees-projet.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/idees-projet.service.ts)

Endpoints d’actions utilisés :
- `POST /api/maturation/ideeprojet/{id}/soumettre`
- `POST /api/maturation/ideeprojet/{id}/valider-sommaire`
- `POST /api/maturation/ideeprojet/{id}/rejeter-sommaire`
- `POST /api/maturation/ideeprojet/{id}/demarrer-note-conceptuelle`
- `POST /api/maturation/ideeprojet/{id}/soumettre-note-conceptuelle`
- `POST /api/maturation/ideeprojet/{id}/valider-faisabilite`
- `POST /api/maturation/ideeprojet/{id}/soumettre-prodoc`
- `POST /api/maturation/ideeprojet/{id}/valider-prodoc`
- `POST /api/maturation/ideeprojet/{id}/identifier-financement`
- `POST /api/maturation/ideeprojet/{id}/soumettre-dossier-projet`
- `POST /api/maturation/ideeprojet/{id}/valider-dossier-projet`
- `POST /api/maturation/ideeprojet/{id}/retourner-dossier-projet`

### Documents des idées
- Menu : `Maturation > Documents`
- Route frontend : `/app/maturation/documents`
- Composant : [documents.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/maturation/documents/documents.component.ts)
- Service : [document-idee.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/document-idee.service.ts)

Endpoints utilisés :
- `GET /api/documents-idee/idee/{ideeProjetId}`
- `POST /api/documents-idee/upload`
- `POST /api/documents-idee/versions/{documentIdOriginal}`
- `GET /api/documents-idee/versions/{ideeProjetId}/{typeDocument}`

Comportements implémentés :
- ajout des types :
  - `DEMANDE_CREATION_PROJET`
  - `PROJET_ARRETE_CONJOINT`
  - `PROTOCOLE_ACCORD_ETAT_PARTENAIRE`
- gestion du remplacement si un document actif du même type existe déjà
- affichage de l’historique des versions

### Dossier projet
Dans le détail d’idée, le front gère le dossier projet requis avec ces types :
- `DEMANDE_CREATION_PROJET`
- `PROJET_ARRETE_CONJOINT`
- `PROTOCOLE_ACCORD_ETAT_PARTENAIRE`
- `PRODOC`

Règles front implémentées :
- pré-check avant soumission
- validation uniquement en statut `SOUMISSION_DOSSIER_PROJET`
- gestion du code d’erreur `DOSSIER_PROJET_INCOMPLET`

## PIP

### Documents des projets
- Menu : `PIP > Documents`
- Route frontend : `/app/pip/documents`
- Composant : [documents-projet.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/pip/documents-projet/documents-projet.component.ts)
- Service : [document-projet.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/document-projet.service.ts)

Endpoints utilisés :
- `GET /api/documents-projet/projet/{projetId}`
- `POST /api/documents-projet/upload`
- `POST /api/documents-projet/versions/{documentIdOriginal}`
- `GET /api/documents-projet/versions/{projetId}/{typeDocument}`

Comportements implémentés :
- remplacement au lieu d’un doublon si un document actif du même type existe
- affichage de l’historique des versions

## Dashboard

### Statistiques
- Menu : `Dashboard`
- Route frontend : `/app/dashboard`
- Composant : [dashboard.component.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/features/dashboard/dashboard.component.ts)

Endpoint utilisé :
- `GET /api/dashboard/statistiques`

Statistiques branchées côté frontend :
- `ideesParCible`
- `projetsParCible`

Affichages ajoutés :
- graphique `Idées par cible`
- graphique `Projets par cible`

## Authentification

Fichiers principaux :
- [main.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/main.ts)
- [auth.service.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/services/auth.service.ts)
- [auth.interceptor.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/core/interceptors/auth.interceptor.ts)

Comportements implémentés :
- suppression du démarrage sans authentification après timeout
- plus d’appel frontend à `/api/auth/me`
- rafraîchissement du token Keycloak avant requête protégée
- blocage local si aucun token n’est disponible

## Fichiers de route/menu concernés

- [app.routes.ts](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/app.routes.ts)
- [dashboard-layout.component.html](/C:/Users/1/Documents/PROJETS%20WURI/FrontSYGEPIP/Sygepip/src/app/layouts/dashboard-layout/dashboard-layout.component.html)

