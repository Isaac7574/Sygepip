// ============================================
// SYGEPIP - Modèles TypeScript
// Générés à partir de l'API Swagger
// ============================================

// === AUTHENTIFICATION ===
export interface User {
  id: string;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role?: 'ADMIN' | 'USER' | 'MANAGER' | 'VIEWER' | string;
  roles?: string[];
  ministereId?: string;
  directionId?: string;
  typeAffiliation?: 'ETAT' | 'ONG' | 'PTF' | 'PRIVE' | 'COLLECTIVITE' | 'AUTRE';
  organisationExterne?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  refreshToken?: string;
  refreshExpiresIn?: number;
  user?: User;
  userInfo?: User;
  expiresIn?: number;
  tokenType?: string;
  [key: string]: any;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  ministereId?: number;
}

// === RÉFÉRENTIELS ===
export interface Ministere {
  id: string;
  code: string;
  nom: string;
  sigle?: string;
  nomCourt?: string;
  description?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Region {
  id: string;
  code: string;
  nom: string;
  chefLieu?: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Secteur {
  id: string;
  code: string;
  nom: string;
  description?: string;
  couleur?: string;
  niveauPriorite?: 'STRATEGIQUE' | 'PRIORITAIRE' | 'SECONDAIRE' | 'TRANSVERSAL';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Programme {
  id: string;
  code: string;
  nom: string;
  ministereId: string;
  secteurId?: string;
  description?: string;
  dateDebut?: Date;
  dateFin?: Date;
  niveauPriorite?: 'PHARE' | 'STRUCTURANT' | 'PRIORITAIRE' | 'NORMAL' | 'DIFFERE';
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SourceFinancement {
  id: string;
  code: string;
  nom: string;
  type: 'RESSOURCE_EXTERIEURE' | 'CONTREPARTIE_NATIONALE' | 'RESSOURCE_PROPRE_ETAT';
  description?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === MATURATION ===
export interface IdeeProjet {
  id: string;
  code: string;
  titre: string;
  description?: string;
  ministereId: string;
  secteurId?: string;
  portee?: 'NATIONALE' | 'REGIONALE' | 'PROVINCIALE' | 'COMMUNALE' | 'LOCALE' | string;
  regionsIntervention?: string;
  pointFocalNom?: string;
  pointFocalEmail?: string;
  pointFocalTelephone?: string;
  statut?: string;
  scoreSelection?: number;
  createdBy?: string;
  actif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // === Champs Note Conceptuelle (même table) ===
  contexte?: string;
  alignementStrategique?: string;
  resultatsAttendus?: string;
  indicateursPreliminaires?: string;
  descriptionSolution?: string;
  composantesProjet?: string;
  approcheMiseEnOeuvre?: string;
  contraintesRisques?: string;
  hypotheses?: string;
  prerequis?: string;
  sourcesFinancementEnvisagees?: string;
  chronogrammeSynthese?: string;
  impactSocioEconomique?: string;
  impactEnvironnementalSocial?: string;
  durabilite?: string;
}

export interface CritereSelection {
  id: string;
  code: string;
  nom?: string; // For compatibility with existing components (alias for libelle)
  libelle: string;
  description?: string;
  domaine?: string;
  categorie?: string;
  typeValeur?: string;
  poids?: number; // For compatibility with existing components
  minValeur?: number;
  maxValeur?: number;
  valeurMin?: number; // Alias for minValeur
  valeurMax?: number; // Alias for maxValeur
  unite?: string;
  utiliseReference?: boolean;
  obligatoire?: boolean;
  ordre?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScoreIdeeProjet {
  id: number;
  ideeProjetId: number;
  critereId: number;
  valeur: number;
  scoreObtenu: number;
  commentaire?: string;
  evaluePar?: number;
  dateEvaluation: Date;
}

export interface AvisConformiteCNDP {
  id: string;
  ideeProjetId: string;
  numeroAvis?: string;
  dateAvis?: Date;
  typeAvis?: string;
  decision?: string;
  observations?: string;
  recommandations?: string;
  fichierUrl?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentProjet {
  id: string;
  projetId?: string;
  ideeProjetId?: string | number; // Support both types for compatibility
  typeDocument?: string;
  titre?: string;
  description?: string; // For compatibility with existing components
  fichierId?: string;
  fichierUrl?: string; // For compatibility with existing components
  version?: string;
  statut?: string;
  decision?: string;
  justificationDecision?: string;
  dateDecision?: Date;
  decidePar?: string;
  tailleFichier?: number; // For compatibility with existing components
  dateUpload?: Date; // For compatibility with existing components
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === DTOs DOCUMENTS API ===
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

export interface PlanFinancement {
  id: string;
  projetId: string;
  sourceFinancementId: string;
  montant: number;
  pourcentage?: number;
  statut?: string;
  dateEngagement?: Date;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === PROJETS ===
export interface Projet {
  id: string;
  ideeProjetId?: string;
  code: string;
  titre: string;
  categorie?: string;
  ministereId: string;
  secteurId?: string;
  regionId?: string;
  programmeId?: string;
  pipAnnuelId?: string;
  description?: string;
  objectifs?: string;
  coutTotal?: number;
  dateDebutPrevu?: Date;
  dateFinPrevu?: Date;
  dateCreation?: Date;
  dureeEnMois?: number;
  sourceFinancement?: string;
  statut?: string;
  chefProjetId?: string;
  latitude?: number;
  longitude?: number;
  typeStructurant?: string;
  typeProjetPip?: 'NOYAU_SUR' | 'NATIONAL';
  statutInscriptionPip?: 'EN_EXECUTION' | 'INSTANCE_DEMARRAGE';
  financementBoucle?: boolean;
  createdBy?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PipAnnuel {
  id: string;
  pipTriennalId?: string;
  code: string;
  annee: number;
  statut?: string;
  enveloppeGlobale?: number;
  montantProgramme?: number; // For compatibility with existing components
  tauxExecution?: number; // For compatibility with existing components
  dateOuverture?: Date;
  dateCloture?: Date;
  dateValidation?: Date;
  observations?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AutorisationEngagement {
  id: string;
  projetId: string;
  annee: number;
  montantAe: number;
  montantAE?: number; // Alias for montantAe (compatibility)
  natureDepense?: string;
  sourceFinancementId?: string;
  montantCp?: number;
  montantCP?: number; // Alias for montantCp (compatibility)
  ligneBudgetaire?: string;
  lignebudgetaire?: string; // Alias lowercase (compatibility)
  dateAutorisation?: Date;
  statut?: string;
  observations?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditPaiement {
  id: string;
  projetId: string;
  autorisationEngagementId?: string;
  annee: number;
  montantCp: number;
  natureDepense?: string;
  montantPaye?: number;
  dateEcheance?: Date;
  statut?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EnveloppeReference {
  id: string;
  pipAnnuelId: string;
  ministereId?: string;
  secteurId?: string;
  montantEnveloppe: number;
  montantConsomme?: number; // For compatibility with existing components
  tauxConsommation?: number; // For compatibility with existing components
  typeEnveloppe?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === SUIVI-ÉVALUATION ===
export interface SuiviExecution {
  id: string;
  projetId: string;
  code: string;
  periode: string;
  typePeriode?: string;
  annee?: number; // For compatibility with existing components
  tauxAvancementPhysique?: number;
  tauxAvancementFinancier?: number; // For compatibility with existing components
  tauxDecaissement?: number;
  montantDecaisse?: number;
  activitesRealisees?: string;
  difficultes?: string;
  mesuresCorrectives?: string;
  observations?: string; // For compatibility with existing components
  createdBy?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Indicateur {
  id: string;
  projetId: string;
  code: string;
  nom: string;
  description?: string;
  typeIndicateur?: string;
  unite?: string;
  valeurReference?: number;
  valeurCible?: number; // For compatibility with existing components
  valeurActuelle?: number; // For compatibility with existing components
  frequenceMesure?: string; // For compatibility with existing components
  sourceVerification?: string;
  periodicite?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Cible {
  id: string;
  indicateurId: string;
  annee: number;
  valeurCible: number;
  valeurRealisee?: number;
  tauxRealisation?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RapportEvaluation {
  id: string;
  projetId: string;
  typeEvaluation?: string;
  dateEvaluation?: Date;
  evaluateur?: string;
  synthese?: string;
  recommandations?: string;
  scoreGlobal?: number;
  noteGlobale?: number; // Alias for scoreGlobal (compatibility)
  pointsForts?: string; // For compatibility with existing components
  pointsFaibles?: string; // For compatibility with existing components
  cheminRapport?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RapportPerformance {
  id: number;
  projetId: number;
  annee: number;
  periode: string;
  tauxExecutionPhysique?: number;
  tauxExecutionFinancier?: number;
  indicePerformance?: number;
  ecartCout?: number;
  ecartDelai?: number;
  statut: 'CONFORME' | 'ALERTE' | 'CRITIQUE';
  commentaires?: string;
}

export interface Alerte {
  id: number;
  projetId: number;
  typeAlerte: 'RETARD' | 'DEPASSEMENT_BUDGET' | 'QUALITE' | 'RISQUE' | 'AUTRE';
  niveau: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  dateAlerte: Date;
  traitee: boolean;
  dateTraitement?: Date;
  traitePar?: number;
  actionPrise?: string;
}

export interface LocaliteIntervention {
  id: string;
  projetId: string;
  regionId?: string;
  province?: string;
  commune?: string;
  village?: string;
  nomLocalite?: string;
  typeLocalite?: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Activite {
  id: number;
  projetId: number;
  code: string;
  nom: string;
  description?: string;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  dateDebutReelle?: Date;
  dateFinReelle?: Date;
  budgetPrevu?: number;
  budgetConsomme?: number;
  tauxAvancement?: number;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  responsable?: string;
  ordre?: number;
}

// === WORKFLOW ===
export interface WorkflowEtape {
  id: string;
  module?: string;
  codeEtape: string;
  nomEtape: string;
  description?: string; // For compatibility with existing components
  ordre: number;
  delaiJours?: number; // For compatibility with existing components
  etatSource?: string;
  etatCible?: string;
  roleRequis?: string;
  roleValidateur?: string;
  notificationEmail?: boolean;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoriqueWorkflow {
  id: string;
  entiteType: string;
  entiteId: string;
  etapeId?: string;
  etatAvant?: string;
  etatApres?: string;
  commentaire?: string;
  userId?: string;
  dateTransition?: Date;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === COMMUNICATION ===
export interface Actualite {
  id: number;
  titre: string;
  description?: string;
  contenu?: string;
  imageUrl?: string;
  documentUrl?: string;
  categorie?: string;
  auteur?: string;
  datePublication: Date;
  publie: boolean;
  ordre?: number;
}

export interface Media {
  id: number;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  titre: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  categorie?: string;
  tags?: string;
  taille?: number;
  duree?: number;
  dateAjout: Date;
  actif: boolean;
}

export interface TexteReglementaire {
  id: string;
  type?: string;
  numero?: string;
  titre: string;
  description?: string;
  categorie?: string;
  dateAdoption?: Date;
  datePromulgation?: Date;
  datePublication?: Date; // Alias for compatibility
  dateEntreeVigueur?: Date; // For compatibility with existing components
  fichierId?: string;
  fichierUrl?: string; // For compatibility
  autoriteSignature?: string;
  statut?: string;
  nombreTelechargements?: number;
  motsCles?: string; // For compatibility with existing components
  actif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ministre {
  id: number;
  nom: string;
  prenom: string;
  photoUrl?: string;
  fonction: string;
  biographie?: string;
  email?: string;
  telephone?: string;
  dateNomination?: Date;
  actif: boolean;
}

// === AUDIT ===
export interface PisteAudit {
  id: string;
  userId: string;
  action: string;
  entiteType: string;
  entiteId?: string;
  details?: string;
  adresseIp?: string;
  dateAction?: Date;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CritereEvaluation {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  domaine?: string;
  categorie?: string;
  typeValeur?: string;
  minValeur?: number;
  maxValeur?: number;
  unite?: string;
  utiliseReference?: boolean;
  obligatoire?: boolean;
  ordre?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === TYPES UTILITAIRES ===
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FilterParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

// === STATISTIQUES ===
export interface StatistiquesDashboard {
  totalProjets: number;
  projetsEnCours: number;
  projetsTermines: number;
  budgetTotal: number;
  budgetExecute: number;
  tauxExecutionGlobal: number;
  alertesActives: number;
  ideesProjetsEnAttente: number;
}

export interface StatistiquesParSecteur {
  secteurId: number;
  secteurNom: string;
  nombreProjets: number;
  budgetTotal: number;
  tauxExecution: number;
}

export interface StatistiquesParRegion {
  regionId: number;
  regionNom: string;
  nombreProjets: number;
  budgetTotal: number;
  tauxExecution: number;
}

// === DIRECTION ===
export interface Direction {
  id: string;
  code: string;
  nom: string;
  ministereId: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === DÉCAISSEMENT ===
export interface Decaissement {
  id: string;
  creditPaiementId: string;
  sourceFinancementId?: string;
  natureDepense?: string;
  dateDecaissement?: Date;
  montant: number;
  referencePiece?: string;
  commentaire?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// === NOTE CONCEPTUELLE ===
export interface IdeeProjetNoteConceptuelle {
  ideeProjetId: string;
  contexte?: string;
  alignementStrategique?: string;
  resultatsAttendus?: string;
  indicateursPreliminaires?: string;
  descriptionSolution?: string;
  composantesProjet?: string;
  approcheMiseEnOeuvre?: string;
  contraintesRisques?: string;
  hypotheses?: string;
  prerequis?: string;
  sourcesFinancementEnvisagees?: string;
  chronogrammeSynthese?: string;
  impactSocioEconomique?: string;
  impactEnvironnementalSocial?: string;
  durabilite?: string;
}

// === INSCRIPTION PIP ANNUEL ===
export interface InscriptionPipAnnuel {
  id: string;
  pipAnnuelId: string;
  projetId: string;
  statutInscriptionPip?: 'EN_EXECUTION' | 'INSTANCE_DEMARRAGE';
  commentaire?: string;
  dateInscription?: Date;
  inscritPar?: string;
  dateRetrait?: Date;
  retirePar?: string;
  motifRetrait?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InscriptionPipAnnuelRequest {
  pipAnnuelId: string;
  projetId: string;
  statutInscriptionPip?: 'EN_EXECUTION' | 'INSTANCE_DEMARRAGE';
  inscritPar?: string;
  commentaire?: string;
}

export interface RetraitInscriptionPipAnnuelRequest {
  pipAnnuelId?: string;
  projetId?: string;
  retirePar?: string;
  motifRetrait?: string;
}

// === ADMINISTRATION UTILISATEURS ===
export interface UserRegistrationRequest {
  username?: string;
  email: string;
  prenom?: string;
  nom?: string;
  password?: string;
  telephone?: string;
  role?: string;
  ministereId?: string;
  directionId?: string;
  typeAffiliation?: 'ETAT' | 'ONG' | 'PTF' | 'PRIVE' | 'COLLECTIVITE' | 'AUTRE';
  organisationExterne?: string;
  actif?: boolean;
}

export interface UserRegistrationResponse {
  keycloakId?: string;
  localUserId?: string;
  username?: string;
  email?: string;
  role?: string;
  actif?: boolean;
}

// === KEYCLOAK ===
export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  roles?: string[];
}

export interface KeycloakUserCreateRequest {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  password?: string;
  roles?: string[];
}

// === ABAC ===
export interface AbacRule {
  id: string;
  endpoint: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  roles: string[];
  directionIds: string[];
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === GÉOLOCALISATION ===
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    id: number;
    nom: string;
    [key: string]: any;
  };
}

export interface HeatmapData {
  points: GeoPoint[];
  intensity: number[];
}
