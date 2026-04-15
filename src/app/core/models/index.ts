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

// === PROVINCES ===
export interface Province {
  id: string;
  code: string;
  nom: string;
  regionId: string;
  regionNom?: string;
  chefLieu?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === COMMUNES ===
export type TypeCommune = 'URBAINE' | 'RURALE';

export interface Commune {
  id: string;
  code: string;
  nom: string;
  provinceId: string;
  provinceNom?: string;
  regionId?: string;
  regionNom?: string;
  typeCommune?: TypeCommune;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === VILLAGES ===
export interface Village {
  id: string;
  code: string;
  nom: string;
  communeId: string;
  communeNom?: string;
  provinceId?: string;
  provinceNom?: string;
  regionId?: string;
  regionNom?: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === TYPE LOCALITE ENUM ===
export type TypeLocalite = 'REGION' | 'PROVINCE' | 'COMMUNE' | 'VILLAGE';

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

export type TypeSourceFinancement =
  | 'RESSOURCE_PROPRE_ETAT'
  | 'RESSOURCE_EXTERIEURE'
  | 'CONTREPARTIE_NATIONALE';

export interface SourceFinancement {
  id: string;
  code: string;
  nom: string;
  type: TypeSourceFinancement | string;
  description?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NatureDepense {
  id: string;
  code: string;
  nom: string;
  description?: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// === MATURATION ===
export type StatutIdeeProjet =
  | 'IDEE_BROUILLON'
  | 'IDEE_SOUMISE'
  | 'IDEE_SOMMAIRE_SELECTIONNEE'
  | 'IDEE_SOMMAIRE_REJETEE'
  | 'IDEE_ARCHIVEE'
  | 'IDEE_CONCEPTION_BROUILLON'
  | 'CONCEPTION_SOUMISE'
  | 'CONCEPTION_VALIDEE'
  | 'RAPPORT_FAISABILITE_VALIDE'
  | 'PRODOC_SOUMIS'
  | 'PRODOC_VALIDE'
  | 'IDENTIFICATION_FINANCEMENT'
  | 'SOUMISSION_DOSSIER_PROJET'
  | 'DOSSIER_PROJET_VALIDE'
  | 'DOSSIER_PROJET_RETOURNE';
export interface IdeeProjet {
  id: string;
  code: string;
  titre: string;
  description?: string;
  ministereId?: string;
  ministereNom?: string;
  ministereTutelleFinanciereId?: string;
  secteurId?: string;
  portee?: 'NATIONALE' | 'REGIONALE' | 'PROVINCIALE' | 'COMMUNALE' | 'LOCALE' | string;
  regionsIntervention?: string;
  pointFocalNom?: string;
  pointFocalEmail?: string;
  pointFocalTelephone?: string;
  dateSoumission?: Date;
  cibleIds?: string[];
  statut?: StatutIdeeProjet | string;
  etapeId?: string;
  scoreSelection?: number;
  createdBy?: string;
  problematique?: string;
  objectifGeneral?: string;
  objectifsSpecifiques?: string;
  beneficiairesCibles?: string;
  beneficiairesEstimes?: number;
  zoneIntervention?: string;
  coutEstime?: number;
  dureeEstimeeMois?: number;
  porteurProjet?: string;
  actif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
  | 'DEMANDE_CREATION_PROJET'
  | 'ETUDE_FAISABILITE'
  | 'RAPPORT_TECHNIQUE'
  | 'PLAN_FINANCEMENT'
  | 'CAHIER_CHARGES'
  | 'RAPPORT_AVANCEMENT'
  | 'PV_RECEPTION'
  | 'RAPPORT_FAISABILITE'
  | 'PRODOC'
  | 'ACTE_JURIDIQUE'
  | 'PROJET_ARRETE_CONJOINT'
  | 'PROTOCOLE_ACCORD_ETAT_PARTENAIRE'
  | 'DOSSIER_PROJET'
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
export type CategorieProjet =
  | 'CATEGORIE_1_ADMINISTRATION_DIRECTE'
  | 'CATEGORIE_2_STRUCTURE_AUTONOME'
  | 'CATEGORIE_3_AGENCES_PTF_ONG'
  | 'CATEGORIE_4_PPP';

export type TypeProjetPip = 'NOYAU_SUR' | 'NATIONAL';
export type StatutInscriptionPip = 'EN_EXECUTION' | 'INSTANCE_DEMARRAGE';

export type StatutProjet =
  | 'CREE'
  | 'PIP_TECHNIQUE_EN_COURS'
  | 'PIP_TECHNIQUE_SOUMIS'
  | 'PIP_TECHNIQUE_VALIDE'
  | 'PIP_TECHNIQUE_A_CORRIGER'
  | 'PIP_FINANCIER_CREE'
  | 'EN_ARBITRAGE'
  | 'ARBITRAGE_RETENU'
  | 'ARBITRAGE_AJOURNE'
  | 'PIP_VALIDE'
  | 'EN_EXECUTION'
  | 'SUSPENDU'
  | 'CLOTURE';

export type TypeProjetStructurant = 'STRUCTURANT' | 'NON_STRUCTURANT' | 'STRATEGIQUE';

export interface Projet {
  id: string;
  ideeProjetId?: string;
  code: string;
  reference?: string;
  titre: string;
  categorie?: CategorieProjet | string;
  ministereId: string;
  secteurId?: string;
  regionId?: string;
  programmeId?: string;
  pipAnnuelId?: string;
  description?: string;
  objectifs?: string;
  objectifsStrategiques?: string;
  objectifsOperationnel?: string;
  coutTotal?: number;
  dateDebutPrevu?: Date;
  dateFinPrevu?: Date;
  dateCreation?: Date;
  dureeEnMois?: number;
  sourceFinancement?: string;
  statut?: StatutProjet | string;
  etapeId?: string;
  chefProjetId?: string;
  latitude?: number;
  longitude?: number;
  typeStructurant?: TypeProjetStructurant | string;
  typeProjetPip?: TypeProjetPip | string;
  statutInscriptionPip?: StatutInscriptionPip | string;
  financementBoucle?: boolean;
  decaissementActif?: boolean;
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
  natureDepenseId?: string;
  natureDepenseNom?: string;
  natureDepense?: string; // Legacy display
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
  natureDepenseId?: string;
  natureDepenseNom?: string;
  natureDepense?: string; // Legacy display
  montantPaye?: number;
  tauxConsommationCp?: number;
  resteCp?: number;
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
  totalMontantsCp?: number;
  totalDecaissementsProjet?: number;
  tauxExecutionFinanciere?: number;
  tauxCouvertureBudgetaire?: number;
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
  projetId?: string;
  projetIds?: string[];
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
  libelle?: string;
  description?: string;
  quantiteEstimee?: number;
  nom?: string;
  indicateurId?: string;
  annee?: number;
  valeurCible?: number;
  valeurRealisee?: number;
  tauxRealisation?: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjetEditResponseDTO {
  id: string;
  ideeProjetId?: string;
  reference?: string;
  titre?: string;
  ministereId?: string;
  secteurId?: string;
  regionId?: string;
  description?: string;
  categorie?: CategorieProjet | string;
  programmeId?: string;
  objectifsStrategiques?: string;
  objectifsOperationnel?: string;
  coutTotal?: number;
  dateCreation?: Date;
  dateDebutPrevu?: Date;
  dateFinPrevu?: Date;
  pipAnnuelId?: string;
  sourceFinancement?: string;
  dureeEnMois?: number;
  statut?: StatutProjet | string;
  etapeId?: string;
  chefProjetId?: string;
  latitude?: number;
  longitude?: number;
  typeProjetPip?: TypeProjetPip | string;
  statutInscriptionPip?: StatutInscriptionPip | string;
  financementBoucle?: boolean;
  createdBy?: string;
  actif?: boolean;
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
  typeLocalite: TypeLocalite;
  regionId?: string;
  regionNom?: string;
  provinceId?: string;
  provinceNom?: string;
  communeId?: string;
  communeNom?: string;
  villageId?: string;
  villageNom?: string;
  nomComplet?: string;
  description?: string;
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
export type WorkflowActionCode =
  | 'SOUMETTRE'
  | 'RESOUMETTRE'
  | 'VALIDER'
  | 'RETOUR'
  | 'REJETER'
  | 'PASSER_ETAPE'
  | 'ARCHIVER'
  | 'CREER_PROJET'
  | 'CLOTURER'
  | 'RETENIR'
  | 'NON_RETENIR'
  | 'INSCRIRE_PIP';

export interface WorkflowNextAction {
  etapeId: string;
  codeEtape: string;
  nomEtape: string;
  actionCode: WorkflowActionCode;
  etatCible?: string;
  roleRequis?: string;
}

export interface MaturationActionRequestDTO {
  userId?: string;
  commentaire?: string;
}

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

export interface DashboardStats {
  totalIdees: number;
  totalProjets: number;
  totalProjetsActifs: number;
  ideesEnMaturation: number;
  projetsEnPlanification: number;
  projetsEnExecution: number;
  tauxTransformationIdeesEnProjets: number;
  tauxRejetIdees: number;
  projetsParPipAnnuel: { pipAnnuelId: string; annee: number; nombreProjets: number }[];
  montantParPipAnnuel: { pipAnnuelId: string; annee: number; montantTotal: number }[];
  repartitionTypeProjetPip: { typeProjetPip: string; nombreProjets: number }[];
  projetsParSecteur: { secteurId: string; secteurNom: string; nombreProjets: number }[];
  montantParSecteur: { secteurId: string; secteurNom: string; montantTotal: number }[];
  ideesParCible: { cibleId: string; cibleLibelle: string; nombre: number }[];
  projetsParCible: { cibleId: string; cibleLibelle: string; nombre: number }[];
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
  projetId?: string;
  dateDecaissement?: Date;
  montant: number;
  referencePiece?: string;
  commentaire?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// === NOTE CONCEPTUELLE ===
export interface IdeeProjetNoteConceptuelleRequest {
  ideeProjetId: string;
  contexte?: string;
  alignementStrategique?: string;
  cibleIds?: string[];
  beneficiairesEstimes?: number;
  coutEstime?: number;
  resultatsAttendus?: string;
  indicateursPreliminaires?: string;
  descriptionSolution?: string;
  composantesProjet?: string;
  approcheMiseEnOeuvre?: string;
  contraintesRisques?: string;
  hypotheses?: string;
  prerequis?: string;
  sourcesFinancementEnvisagees?: string;
  dureeEstimeeMois?: number;
  chronogrammeSynthese?: string;
  impactSocioEconomique?: string;
  impactEnvironnementalSocial?: string;
  durabilite?: string;
}

export interface IdeeProjetNoteConceptuelleResponse {
  id?: string;
  ideeProjetId: string;
  code?: string;
  titre?: string;
  description?: string;
  ministereId?: string;
  secteurId?: string;
  portee?: string;
  regionsIntervention?: string;
  pointFocalNom?: string;
  pointFocalEmail?: string;
  pointFocalTelephone?: string;
  dateSoumission?: Date;
  statut?: StatutIdeeProjet | string;
  scoreSelection?: number;
  problematique?: string;
  contexte?: string;
  alignementStrategique?: string;
  cibleIds?: string[];
  beneficiairesCibles?: string;
  objectifGeneral?: string;
  objectifsSpecifiques?: string;
  resultatsAttendus?: string;
  indicateursPreliminaires?: string;
  descriptionSolution?: string;
  composantesProjet?: string;
  approcheMiseEnOeuvre?: string;
  contraintesRisques?: string;
  hypotheses?: string;
  prerequis?: string;
  beneficiairesEstimes?: number;
  coutEstime?: number;
  sourcesFinancementEnvisagees?: string;
  dureeEstimeeMois?: number;
  chronogrammeSynthese?: string;
  impactSocioEconomique?: string;
  impactEnvironnementalSocial?: string;
  durabilite?: string;
  zoneIntervention?: string;
  porteurProjet?: string;
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
  ministereIds?: string[];
  directionIds: string[];
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AbacMinistere {
  id: string;
  code: string;
  nom: string;
}

export interface AbacDirection {
  id: string;
  code: string;
  nom: string;
  ministereId: string;
}

export interface AbacEndpointsPageDTO {
  page: number;
  size: number;
  total: number;
  items: string[];
}

// === PROGRAMMATION TECHNIQUE & FINANCIÈRE ===
export type ModeFinancement = 'CONTREPARTIE' | 'SUBVENTION' | 'PRET';

export interface ProgrammationTechniqueRequestDTO {
  code?: string;
  categorie?: CategorieProjet;
  programmeId?: string;
  objectifsStrategiques?: string;
  objectifsOperationnel?: string;
  dateDebutPrevu?: string; // ISO 8601 YYYY-MM-DDTHH:mm:ss
  dateFinPrevu?: string;
  dureeEnMois?: number;
  typeProjetPip?: TypeProjetPip;
  statutInscriptionPip?: StatutInscriptionPip;
}

export interface AutorisationEngagementRequestDTO {
  projetId?: string;
  montantAe?: number;
  sourceFinancementId?: string;
  modeFinancement?: ModeFinancement;
  ligneBudgetaire?: string;
  natureDepenseId?: string;
  dateAutorisation?: string; // ISO 8601
  statut?: string;
  observations?: string;
  actif?: boolean;
}

export interface CreditPaiementRequestDTO {
  autorisationEngagementId?: string;
  annee?: number;
  montantCp?: number;
  natureDepenseId?: string;
  montantPaye?: number;
  dateEcheance?: string; // ISO 8601
  statut?: string;
  actif?: boolean;
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

export interface ArbitrageProjetRequestDTO {
  coutTotal?: number;
  autorisationEngagementId?: string;
  montantAe?: number;
  creditPaiementId?: string;
  montantCp?: number;
}

export interface ArbitrageProjetResponseDTO {
  projet: Projet;
  autorisationEngagement?: AutorisationEngagement | null;
  creditPaiement?: CreditPaiement | null;
}
