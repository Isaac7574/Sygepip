# Guide Frontend - Suivi-Evaluation

Ce document recense les ecrans, routes, modeles et endpoints actuellement utilises par le frontend pour le module Suivi-Evaluation, afin que le backend puisse mettre a jour son guide de contrat API sans casser le front.

## 1. Perimetre Front

Le menu `Suivi-Evaluation` expose 5 ecrans :

- `/app/suivi/execution`
- `/app/suivi/indicateurs`
- `/app/suivi/evaluations`
- `/app/suivi/cartographie`
- `/app/suivi/alertes`

Routes declarees dans :

- [app.routes.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\app.routes.ts)

Point important :

- le frontend consomme principalement des endpoints CRUD generiques
- quand un filtrage par projet est necessaire, le front utilise en general un `query param` `projetId`
- le front n'utilise pas encore, dans ce module, des routes imbriquees du type `/projet/{id}/...`

## 2. Regles de workflow admin-only

Le backend actuel applique les regles suivantes :

- `PIP_VALIDE -> PROGRESSION_SAISIE`
- transition automatique des qu'un suivi d'execution est cree ou mis a jour avec `tauxAvancementPhysique` renseigne
- aucune gestion de role specifique dans le frontend pour ce module a ce stade
- usage actuel : `ADMIN` uniquement

Pour les indicateurs :

- pas de transition automatique backend vers `INDICATEURS_CREES` ou `INDICATEURS_EVALUES` pour l'instant
- le frontend peut deduire un badge purement visuel si au moins un indicateur existe pour le projet

## 3. Suivi d'execution

Ecran :

- [execution.component.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\features\suivi\execution\execution.component.ts)

Service :

- [suivi-execution.service.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\services\suivi-execution.service.ts)

Modele :

- [index.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\models\index.ts)

### Endpoints utilises

- `GET /api/suiviexecution`
- `GET /api/suiviexecution/{id}`
- `POST /api/suiviexecution`
- `PUT /api/suiviexecution/{id}`
- `DELETE /api/suiviexecution/{id}`
- `GET /api/suiviexecution?projetId={id}`
- `GET /api/suiviexecution?annee={annee}`

### Champs attendus par le front

- `id`
- `projetId`
- `code`
- `periode`
- `typePeriode`
- `annee`
- `tauxAvancementPhysique`
- `tauxAvancementFinancier`
- `tauxDecaissement`
- `montantDecaisse`
- `totalMontantsCp`
- `totalDecaissementsProjet`
- `tauxExecutionFinanciere`
- `tauxCouvertureBudgetaire`
- `activitesRealisees`
- `difficultes`
- `mesuresCorrectives`
- `observations`
- `createdBy`
- `actif`
- `createdAt`
- `updatedAt`

### Champs actuellement saisis dans le formulaire

- `code`
- `periode`
- `typePeriode`
- `annee`
- `tauxAvancementPhysique`
- `tauxAvancementFinancier`
- `observations`
- `actif`

### Champs calcules en lecture seule

- `tauxDecaissement`
- `montantDecaisse`
- `totalMontantsCp`
- `totalDecaissementsProjet`
- `tauxExecutionFinanciere`
- `tauxCouvertureBudgetaire`

### Regles UI importantes

- ne jamais envoyer les champs calcules dans les `POST` et `PUT`
- apres un `POST` ou `PUT` reussi, rafraichir les donnees du projet si l'ecran depend du statut ou des agregats financiers

## 4. Decaissements et impact financier automatique

Le module Suivi-Evaluation depend indirectement des decaissements pour recalculer plusieurs agregats de `SuiviExecution` et de `CreditPaiement`.

### Endpoints lies

- `POST /api/decaissement`
- `PUT /api/decaissement/{id}`
- `DELETE /api/decaissement/{id}`

### Payload attendu

```json
{
  "creditPaiementId": "uuid",
  "dateDecaissement": "2026-03-26T12:00:00",
  "montant": 50000,
  "referencePiece": "string",
  "commentaire": "string"
}
```

### Regles UI importantes

- apres chaque creation, modification ou suppression de decaissement, recharger :
- `GET /api/creditpaiement?projetId={id}`
- `GET /api/suiviexecution?projetId={id}`

## 5. Credit de paiement

Le backend expose des champs calcules supplementaires utilises en lecture seule.

### Champs calcules de reponse

- `montantPaye`
- `tauxConsommationCp`
- `resteCp`

### Exemple de structure retournee

```json
{
  "montantCp": 1000000,
  "montantPaye": 200000,
  "tauxConsommationCp": 20.0,
  "resteCp": 800000
}
```

### Regles UI

- ces champs sont en lecture seule
- ne pas les envoyer dans les `POST` et `PUT`

## 6. Indicateurs

Ecran :

- [indicateurs.component.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\features\suivi\indicateurs\indicateurs.component.ts)

Service :

- [indicateurs.service.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\services\indicateurs.service.ts)

### Endpoints utilises

- `GET /api/indicateur`
- `GET /api/indicateur/{id}`
- `POST /api/indicateur`
- `PUT /api/indicateur/{id}`
- `DELETE /api/indicateur/{id}`
- `GET /api/indicateur?projetId={id}`

### Champs attendus par le front

- `id`
- `projetId`
- `code`
- `nom`
- `description`
- `typeIndicateur`
- `unite`
- `valeurReference`
- `valeurCible`
- `valeurActuelle`
- `frequenceMesure`
- `sourceVerification`
- `periodicite`
- `actif`
- `createdAt`
- `updatedAt`

### Champs actuellement saisis dans le formulaire

- `code`
- `nom`
- `description`
- `unite`
- `valeurCible`
- `valeurActuelle`
- `frequenceMesure`

### Logique front associee

Le frontend calcule localement une progression :

- `progression = valeurActuelle / valeurCible`

### Regle UI provisoire alignee backend

- si `GET /api/indicateur?projetId={id}` retourne au moins un item, le frontend peut afficher un etat visuel `indicateurs crees`
- ce badge reste purement frontend tant que le backend ne porte pas de transition workflow dediee

### Note de contrat

- backend actuel : `valeurActuelle` et `valeurCible` ne sont pas encore completement gerees en persistance metier selon votre guide
- le frontend peut continuer a les manipuler dans le formulaire, mais il faut les considerer comme provisoires tant que le backend n'est pas aligne

## 7. Evaluations

Ecran :

- [evaluations.component.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\features\suivi\evaluations\evaluations.component.ts)

Service :

- [evaluations.service.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\services\evaluations.service.ts)

### Endpoints utilises

- `GET /api/rapportevaluation`
- `GET /api/rapportevaluation/{id}`
- `POST /api/rapportevaluation`
- `PUT /api/rapportevaluation/{id}`
- `DELETE /api/rapportevaluation/{id}`
- `GET /api/rapportevaluation?projetId={id}`
- `GET /api/rapportevaluation?type={type}`

### Champs attendus par le front

- `id`
- `projetId`
- `typeEvaluation`
- `dateEvaluation`
- `evaluateur`
- `synthese`
- `recommandations`
- `scoreGlobal`
- `noteGlobale`
- `pointsForts`
- `pointsFaibles`
- `cheminRapport`
- `actif`
- `createdAt`
- `updatedAt`

### Champs actuellement saisis dans le formulaire

- `projetId`
- `typeEvaluation`
- `dateEvaluation`
- `evaluateur`
- `noteGlobale`
- `pointsForts`
- `pointsFaibles`
- `recommandations`

### Dependances supplementaires

L'ecran charge aussi :

- `GET /api/projet`

pour remplir la liste de selection des projets.

## 8. Cartographie

Ecran :

- [cartographie.component.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\features\suivi\cartographie\cartographie.component.ts)

Service :

- [cartographie.service.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\services\cartographie.service.ts)

### Endpoints utilises

- `GET /api/localiteintervention`
- `GET /api/localiteintervention/{id}`
- `POST /api/localiteintervention`
- `PUT /api/localiteintervention/{id}`
- `DELETE /api/localiteintervention/{id}`
- `GET /api/localiteintervention?projetId={id}`
- `GET /api/localiteintervention?regionId={id}`

### Champs attendus par le front

- `id`
- `projetId`
- `typeLocalite`
- `regionId`
- `regionNom`
- `provinceId`
- `provinceNom`
- `communeId`
- `communeNom`
- `villageId`
- `villageNom`
- `nomComplet`
- `description`
- `latitude`
- `longitude`
- `actif`
- `createdAt`
- `updatedAt`

### Champs actuellement envoyes

- `projetId`
- `typeLocalite`
- `regionId`
- `provinceId`
- `communeId`
- `villageId`
- `description`
- `latitude`
- `longitude`
- `actif`

### Regles frontend importantes

Selon `typeLocalite`, le front impose :

- `REGION` : `regionId` requis
- `PROVINCE` : `regionId` et `provinceId` requis
- `COMMUNE` : `regionId`, `provinceId` et `communeId` requis
- `VILLAGE` : `regionId`, `provinceId`, `communeId` et `villageId` requis

### Referentiels utilises par l'ecran

- `GET /api/projet`
- `GET /api/region`
- `GET /api/province?regionId={id}`
- `GET /api/commune?provinceId={id}`
- `GET /api/village?communeId={id}`

## 9. Alertes

Ecran :

- [alertes.component.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\features\suivi\alertes\alertes.component.ts)

Service :

- [alertes.service.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\services\alertes.service.ts)

### Endpoints utilises

- `GET /api/alerte`
- `GET /api/alerte/{id}`
- `POST /api/alerte`
- `PUT /api/alerte/{id}`
- `DELETE /api/alerte/{id}`
- `GET /api/alerte?projetId={id}`
- `GET /api/alerte?traitee=false`
- `POST /api/alerte/{id}/traiter`

### Payload du traitement explicite

Le frontend sait appeler :

- `POST /api/alerte/{id}/traiter`

avec ce body :

```json
{
  "actionPrise": "..."
}
```

### Champs attendus par le front

- `id`
- `projetId`
- `typeAlerte`
- `niveau`
- `message`
- `dateAlerte`
- `traitee`
- `dateTraitement`
- `traitePar`
- `actionPrise`

### Champs actuellement saisis dans le formulaire

- `projetId`
- `typeAlerte`
- `niveau`
- `message`
- `dateAlerte`
- `traitee`
- `actionPrise`

### Comportement frontend important

Le bouton de bascule `traitee / non traitee` ne passe pas actuellement par `POST /traiter`.

Il fait un :

- `PUT /api/alerte/{id}`

avec tout l'objet existant et `traitee` inverse.

### Dependances supplementaires

L'ecran charge aussi :

- `GET /api/projet`

pour la selection du projet.

## 10. Modeles frontend lies au Suivi-Evaluation

Fichier :

- [index.ts](C:\Users\1\Documents\PROJETS WURI\FrontSYGEPIP\Sygepip\src\app\core\models\index.ts)

### SuiviExecution

- `id`
- `projetId`
- `code`
- `periode`
- `typePeriode`
- `annee`
- `tauxAvancementPhysique`
- `tauxAvancementFinancier`
- `tauxDecaissement`
- `montantDecaisse`
- `activitesRealisees`
- `difficultes`
- `mesuresCorrectives`
- `observations`
- `createdBy`
- `actif`
- `createdAt`
- `updatedAt`

### Indicateur

- `id`
- `projetId`
- `code`
- `nom`
- `description`
- `typeIndicateur`
- `unite`
- `valeurReference`
- `valeurCible`
- `valeurActuelle`
- `frequenceMesure`
- `sourceVerification`
- `periodicite`
- `actif`
- `createdAt`
- `updatedAt`

### Cible

Modele present dans le frontend et lie indirectement au suivi-evaluation :

- `id`
- `libelle`
- `description`
- `quantiteEstimee`
- `nom`
- `indicateurId`
- `annee`
- `valeurCible`
- `valeurRealisee`
- `tauxRealisation`
- `actif`
- `createdAt`
- `updatedAt`

### RapportEvaluation

- `id`
- `projetId`
- `typeEvaluation`
- `dateEvaluation`
- `evaluateur`
- `synthese`
- `recommandations`
- `scoreGlobal`
- `noteGlobale`
- `pointsForts`
- `pointsFaibles`
- `cheminRapport`
- `actif`
- `createdAt`
- `updatedAt`

### Alerte

- `id`
- `projetId`
- `typeAlerte`
- `niveau`
- `message`
- `dateAlerte`
- `traitee`
- `dateTraitement`
- `traitePar`
- `actionPrise`

### LocaliteIntervention

- `id`
- `projetId`
- `typeLocalite`
- `regionId`
- `regionNom`
- `provinceId`
- `provinceNom`
- `communeId`
- `communeNom`
- `villageId`
- `villageNom`
- `nomComplet`
- `description`
- `latitude`
- `longitude`
- `actif`
- `createdAt`
- `updatedAt`

## 11. Enums et valeurs metier visibles dans le front

### typePeriode

- `MENSUEL`
- `TRIMESTRIEL`
- `SEMESTRIEL`
- `ANNUEL`

### typeEvaluation

- `MI_PARCOURS`
- `FINALE`
- `EX_POST`
- `IMPACT`

### typeLocalite

- `REGION`
- `PROVINCE`
- `COMMUNE`
- `VILLAGE`

### typeAlerte

- `RETARD`
- `DEPASSEMENT_BUDGET`
- `QUALITE`
- `RISQUE`
- `AUTRE`

### niveau

- `INFO`
- `WARNING`
- `CRITICAL`

## 12. Recommandations pour le guide backend

Pour que le frontend puisse rester compatible apres corrections, le guide backend devrait documenter explicitement :

- les endpoints reels exposes
- les DTO request
- les DTO response
- les champs obligatoires
- les enums autorises
- les query params supportes
- les erreurs fonctionnelles et techniques
- des exemples JSON reels

Le point le plus important pour le module Suivi-Evaluation est :

- le frontend actuel attend des endpoints CRUD racine
- le filtrage par projet se fait majoritairement par `query param`
- certaines logiques UI, notamment `cartographie` et `alertes`, ont des regles specifiques qu'il faut conserver ou re-documenter clairement
- `SuiviExecution` contient maintenant des champs calcules a exposer en lecture seule
- les operations sur `decaissement` doivent entrainer un rechargement frontend de `creditpaiement` et `suiviexecution`
- le workflow `PIP_VALIDE -> PROGRESSION_SAISIE` est declenche par le backend, pas par le frontend

## 13. Resume ultra court pour le backend

Le frontend Suivi-Evaluation consomme actuellement :

- `/api/suiviexecution`
- `/api/indicateur`
- `/api/rapportevaluation`
- `/api/localiteintervention`
- `/api/alerte`

avec filtrage principal par :

- `?projetId=...`

et dependances referentielles :

- `/api/projet`
- `/api/region`
- `/api/province`
- `/api/commune`
- `/api/village`

Points complementaires a conserver dans le guide :

- `PIP_VALIDE -> PROGRESSION_SAISIE` est automatique a la creation ou mise a jour d'un suivi d'execution avec `tauxAvancementPhysique`
- `SuiviExecution` expose plusieurs champs financiers calcules en lecture seule
- apres operation sur `decaissement`, le frontend doit recharger `creditpaiement` et `suiviexecution`
- le statut visuel `indicateurs crees` peut etre deduit cote frontend par l'existence d'au moins un indicateur
