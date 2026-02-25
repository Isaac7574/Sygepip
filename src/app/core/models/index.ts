// ============================================
// SYGEPIP - Modèles TypeScript
// Générés à partir de l'API Swagger
// ============================================

// === AUTHENTIFICATION ===
export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'USER' | 'MANAGER' | 'VIEWER';
  ministereId?: number;
  actif: boolean;
  dateCreation: Date;
  derniereConnexion?: Date;
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
  id: number;
  code: string;
  nom: string;
  sigle?: string;
  nomCourt?: string;
  description?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logoUrl?: string;
  actif: boolean;
  dateCreation: Date;
  dateModification?: Date;
}

export interface Region {
  id: number;
  code: string;
  nom: string;
  chefLieu?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  superficie?: number;
  actif: boolean;
}

export interface Secteur {
  id: number;
  code: string;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
  actif: boolean;
}

export interface Programme {
  id: number;
  code: string;
  nom: string;
  ministereId: number;
  secteurId?: number;
  description?: string;
  objectifs?: string;
  dateDebut?: Date;
  dateFin?: Date;
  budgetTotal?: number;
  actif: boolean;
}

export interface SourceFinancement {
  id: number;
  code: string;
  nom: string;
  type: 'INTERNE' | 'EXTERNE' | 'MIXTE';
  description?: string;
  paysOrigine?: string;
  actif: boolean;
}

// === MATURATION ===
export interface IdeeProjet {
  id: number;
  code: string;
  titre: string;
  description?: string;
  ministereId: number;
  secteurId?: number;
  regionId?: number;
  programmeId?: number;
  categorie: 'NOUVEAU' | 'EN_COURS' | 'EXTENSION' | 'REHABILITATION';
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  coutEstime?: number;
  dureeEstimee?: number;
  beneficiaires?: string;
  objectifs?: string;
  resultatsAttendus?: string;
  etapeWorkflow: string;
  statut: 'BROUILLON' | 'SOUMIS' | 'EN_EVALUATION' | 'VALIDE' | 'REJETE';
  scoreTotal?: number;
  dateCreation: Date;
  dateSoumission?: Date;
  dateValidation?: Date;
  creePar?: number;
  validePar?: number;
}

export interface CritereSelection {
  id: number;
  code: string;
  nom: string;
  description?: string;
  categorie: string;
  poids: number;
  valeurMin?: number;
  valeurMax?: number;
  actif: boolean;
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
  id: number;
  ideeProjetId: number;
  numeroAvis: string;
  dateAvis: Date;
  typeAvis: 'FAVORABLE' | 'DEFAVORABLE' | 'RESERVE';
  observations?: string;
  recommandations?: string;
  fichierUrl?: string;
}

export interface DocumentProjet {
  id: number;
  projetId?: number;
  ideeProjetId?: number;
  typeDocument: string;
  titre: string;
  description?: string;
  fichierUrl: string;
  tailleFichier?: number;
  mimeType?: string;
  version?: number;
  uploadePar?: number;
  dateUpload: Date;
}

export interface PlanFinancement {
  id: number;
  projetId: number;
  sourceFinancementId: number;
  montant: number;
  pourcentage?: number;
  devise?: string;
  conditionsFinancement?: string;
  dateAccord?: Date;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'DECAISSE';
}

// === PIP ===
export interface Projet {
  id: number;
  ideeProjetId?: number;
  code: string;
  titre: string;
  categorie: 'NOUVEAU' | 'EN_COURS' | 'EXTENSION' | 'REHABILITATION';
  ministereId: number;
  secteurId?: number;
  regionId?: number;
  programmeId?: number;
  description?: string;
  objectifs?: string;
  resultatsAttendus?: string;
  coutTotal: number;
  coutPrevisionnel?: number;
  dateDebut?: Date;
  dateFin?: Date;
  dureeEnMois?: number;
  maitreOuvrage?: string;
  maitreOeuvre?: string;
  entrepriseExecutante?: string;
  tauxAvancementPhysique?: number;
  tauxAvancementFinancier?: number;
  statut: 'PLANIFIE' | 'EN_COURS' | 'SUSPENDU' | 'TERMINE' | 'ANNULE';
  etapeWorkflow: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  dateCreation: Date;
}

export interface PipAnnuel {
  id: number;
  code: string;
  annee: number;
  statut: 'PREPARATION' | 'VALIDATION' | 'EXECUTION' | 'CLOTURE';
  enveloppeGlobale?: number;
  montantProgramme?: number;
  montantExecute?: number;
  tauxExecution?: number;
  dateOuverture?: Date;
  dateCloture?: Date;
  observations?: string;
  actif: boolean;
}

export interface AutorisationEngagement {
  id: number;
  projetId: number;
  annee: number;
  montantAE: number;
  montantCP?: number;
  natureDepense?: string;
  lignebudgetaire?: string;
  dateAutorisation?: Date;
  statut: 'PREVU' | 'AUTORISE' | 'ENGAGE';
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreditPaiement {
  id: number;
  projetId: number;
  autorisationEngagementId?: number;
  annee: number;
  montantCP: number;
  montantPaye?: number;
  dateEcheance?: Date;
  statut: 'PREVU' | 'ORDONNANCE' | 'PAYE';
}

export interface EnveloppeReference {
  id: number;
  pipAnnuelId: number;
  ministereId?: number;
  secteurId?: number;
  montantEnveloppe: number;
  montantConsomme?: number;
  tauxConsommation?: number;
}

// === SUIVI-ÉVALUATION ===
export interface SuiviExecution {
  id: number;
  projetId: number;
  code: string;
  periode: string;
  typePeriode: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';
  annee: number;
  tauxAvancementPhysique?: number;
  tauxAvancementFinancier?: number;
  montantDecaisse?: number;
  observations?: string;
  difficultesRencontrees?: string;
  mesuresCorrectives?: string;
  dateRapport: Date;
  rapportePar?: number;
  actif: boolean;
}

export interface Indicateur {
  id: number;
  projetId: number;
  code: string;
  nom: string;
  description?: string;
  unite?: string;
  valeurReference?: number;
  valeurCible?: number;
  valeurActuelle?: number;
  source?: string;
  frequenceMesure?: string;
  responsable?: string;
}

export interface Cible {
  id: number;
  indicateurId: number;
  annee: number;
  valeurCible: number;
  valeurRealisee?: number;
  tauxRealisation?: number;
  observations?: string;
}

export interface RapportEvaluation {
  id: number;
  projetId: number;
  typeEvaluation: 'MI_PARCOURS' | 'FINALE' | 'EX_POST' | 'IMPACT';
  dateEvaluation: Date;
  evaluateur?: string;
  noteGlobale?: number;
  pointsForts?: string;
  pointsFaibles?: string;
  recommandations?: string;
  fichierRapportUrl?: string;
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
  id: number;
  projetId: number;
  regionId: number;
  province?: string;
  commune?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
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
  id: number;
  module: 'MATURATION' | 'PIP' | 'SUIVI';
  codeEtape: string;
  nomEtape: string;
  ordre: number;
  description?: string;
  delaiJours?: number;
  roleValidateur?: string;
  actionsDisponibles?: string;
  etapeSuivante?: string;
  etapePrecedente?: string;
  actif: boolean;
}

export interface HistoriqueWorkflow {
  id: number;
  entiteType: string;
  entiteId: number;
  etapeId: number;
  etatAvant?: string;
  etatApres: string;
  action: string;
  commentaire?: string;
  effectuePar?: number;
  dateAction: Date;
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
  id: number;
  type: 'LOI' | 'DECRET' | 'ARRETE' | 'CIRCULAIRE' | 'NOTE' | 'AUTRE';
  numero: string;
  titre: string;
  description?: string;
  datePublication: Date;
  dateEntreeVigueur?: Date;
  fichierUrl?: string;
  categorie?: string;
  motsCles?: string;
  actif: boolean;
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
  id: number;
  userId: number;
  action: string;
  entiteType: string;
  entiteId?: number;
  ancienneValeur?: string;
  nouvelleValeur?: string;
  adresseIp?: string;
  userAgent?: string;
  dateAction: Date;
}

export interface CritereEvaluation {
  id: number;
  code: string;
  nom: string;
  description?: string;
  poids: number;
  categorie?: string;
  actif: boolean;
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
