# Changelog - Module Documents

**Date:** 2026-02-27
**Version:** 1.0.0
**Auteur:** Claude Code

---

## Résumé

Implémentation complète du module de gestion des documents pour les projets et idées de projet, basée sur la nouvelle API backend.

---

## Fichiers créés

### Services

#### `src/app/core/services/document-projet.service.ts`
Service pour la gestion des documents de projet (PIP).

```typescript
// Méthodes disponibles
upload(file, typeDocument, projetId, userId?)  // Upload un document
download(id)                                    // Télécharge un document (Blob)
getByProjet(projetId)                          // Liste par projet
getByType(typeDocument)                        // Liste par type
recherche(motCle)                              // Recherche par mot-clé
getVersions(projetId, typeDocument)            // Historique des versions
delete(id)                                     // Suppression logique
downloadAndSave(id, filename)                  // Télécharge et sauvegarde
```

#### `src/app/core/services/document-idee.service.ts`
Service pour la gestion des documents d'idées de projet.

```typescript
// Méthodes disponibles
upload(file, typeDocument, ideeProjetId, userId?)  // Upload un document
download(id)                                        // Télécharge un document (Blob)
getByIdeeProjet(ideeProjetId)                      // Liste par idée projet
getByType(typeDocument)                            // Liste par type
recherche(motCle)                                  // Recherche par mot-clé
getVersions(ideeProjetId, typeDocument)            // Historique des versions
delete(id)                                         // Suppression logique
downloadAndSave(id, filename)                      // Télécharge et sauvegarde
```

### Composants

#### `src/app/features/pip/documents-projet/`
Nouveau composant pour la gestion des documents de projets PIP.

| Fichier | Description |
|---------|-------------|
| `documents-projet.component.ts` | Logique du composant |
| `documents-projet.component.html` | Template avec tableau, modals upload/versions |
| `documents-projet.component.scss` | Styles (modal, formulaires) |

---

## Fichiers modifiés

### `src/app/core/models/index.ts`

Ajout des interfaces et types suivants :

```typescript
// Types énumérés
export type TypeDocumentProjet =
  | 'NOTE_CONCEPTUELLE'
  | 'ETUDE_FAISABILITE'
  | 'RAPPORT_TECHNIQUE'
  | 'PLAN_FINANCEMENT'
  | 'CAHIER_CHARGES'
  | 'RAPPORT_AVANCEMENT'
  | 'PV_RECEPTION'
  | 'AUTRE';

export type StatutDocument = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
export type DecisionDocument = 'ACCEPTE' | 'REFUSE' | 'EN_ATTENTE';

// DTOs
export interface DocumentProjetResponseDTO {
  id: string;
  typeDocument: TypeDocumentProjet;
  titre: string;
  projetId: string;
  fichierId: string;
  version: string;
  statut: StatutDocument;
  decision: DecisionDocument;
  justificationDecision?: string;
  dateDecision?: Date;
  decidePar?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentIdeeProjetResponseDTO {
  id: string;
  typeDocument: TypeDocumentProjet;
  titre: string;
  ideeProjetId: string;
  fichierId: string;
  version: string;
  statut: StatutDocument;
  decision: DecisionDocument;
  justificationDecision?: string;
  dateDecision?: Date;
  decidePar?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentUploadRequest {
  file: File;
  typeDocument: TypeDocumentProjet;
  projetId?: string;
  ideeProjetId?: string;
  userId?: string;
}
```

### `src/app/features/maturation/documents/documents.component.ts`

Refactorisation complète pour utiliser le nouveau `DocumentIdeeService` :
- Utilisation des nouveaux DTOs
- Upload via FormData
- Téléchargement avec download automatique
- Modal historique des versions
- Recherche via API

### `src/app/features/maturation/documents/documents.component.html`

Mise à jour du template :
- Sélecteur d'idée projet obligatoire
- Colonnes : Titre, Type, Version, Statut, Décision, Date, Actions
- Boutons : Télécharger, Historique versions, Supprimer
- Modal d'upload avec drag & drop
- Modal d'historique des versions

### `src/app/app.routes.ts`

Ajout de la route pour le nouveau composant :

```typescript
{
  path: 'pip',
  children: [
    // ... autres routes
    {
      path: 'documents',
      loadComponent: () => import('./features/pip/documents-projet/documents-projet.component')
        .then(m => m.DocumentsProjetComponent)
    }
  ]
}
```

---

## Endpoints API utilisés

### Documents Projet (`/api/documents-projet`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/upload` | Upload d'un document |
| GET | `/download/{id}` | Téléchargement |
| GET | `/projet/{projetId}` | Liste par projet |
| GET | `/type/{typeDocument}` | Liste par type |
| GET | `/recherche?motCle=...` | Recherche |
| GET | `/versions/{projetId}/{typeDocument}` | Historique |
| DELETE | `/{id}` | Suppression logique |

### Documents Idée Projet (`/api/documents-idee`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/upload` | Upload d'un document |
| GET | `/download/{id}` | Téléchargement |
| GET | `/idee/{ideeProjetId}` | Liste par idée |
| GET | `/type/{typeDocument}` | Liste par type |
| GET | `/recherche?motCle=...` | Recherche |
| GET | `/versions/{ideeProjetId}/{typeDocument}` | Historique |
| DELETE | `/{id}` | Suppression logique |

---

## Routes d'accès

| Module | Route | Composant |
|--------|-------|-----------|
| Maturation | `/app/maturation/documents` | DocumentsComponent |
| PIP | `/app/pip/documents` | DocumentsProjetComponent |

---

## Fonctionnalités

### Upload de documents
- Sélection du projet/idée projet
- Choix du type de document
- Sélection du fichier (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
- Upload via FormData

### Téléchargement
- Téléchargement direct via Blob
- Sauvegarde automatique avec le nom du fichier

### Gestion des versions
- Modal dédié pour l'historique
- Téléchargement de n'importe quelle version

### Recherche
- Recherche par mot-clé via API
- Fallback recherche locale en cas d'erreur

### Badges de statut
- `VALIDE` : vert (badge-success)
- `REJETE` : rouge (badge-danger)
- `EN_ATTENTE` : jaune (badge-warning)

---

## Prérequis

- Backend API disponible sur `http://localhost:8085`
- Endpoints documents-projet et documents-idee opérationnels
