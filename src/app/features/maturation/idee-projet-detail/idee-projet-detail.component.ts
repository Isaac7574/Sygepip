import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { DocumentIdeeService } from '@core/services/document-idee.service';
import { DossierProjetIdeeService } from '@core/services/dossier-projet-idee.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { CiblesService } from '@core/services/cibles.service';
import { AuthService } from '@core/services/auth.service';
import { WorkflowService } from '@core/services/workflow.service';
import { SourcesFinancementService } from '@core/services/sources-financement.service';
import { PlanFinancementIdeeProjetService } from '@core/services/plan-financement-idee-projet.service';
import {
  Cible,
  IdeeProjet,
  IdeeProjetNoteConceptuelleRequest,
  IdeeProjetNoteConceptuelleResponse,
  Ministere,
  ModeFinancement,
  PlanFinancementIdeeProjet,
  PlanFinancementIdeeProjetPayload,
  SourceFinancement,
  Secteur,
  DocumentIdeeProjetResponseDTO,
  DossierProjetIdee,
  DossierProjetIdeeDocument,
  DossierProjetTypeDocument,
  TypeDocumentProjet,
  StatutIdeeProjet,
  WorkflowNextAction
} from '@core/models';
import { ToastComponent } from '@shared/components/toast/toast.component';

type DgepWorkspaceTab = 'synthese' | 'financement' | 'dossier';

const DOSSIER_PROJET_REQUIRED_TYPES: TypeDocumentProjet[] = [
  'DEMANDE_CREATION_PROJET',
  'PROJET_ARRETE_CONJOINT',
  'PRODOC',
  'PROTOCOLE_ACCORD_ETAT_PARTENAIRE'
];

const DOSSIER_DOCUMENT_LABELS: Record<DossierProjetTypeDocument, string> = {
  DEMANDE_CREATION_PROJET: 'Lettre de demande de creation de projet',
  PROJET_ARRETE_CONJOINT: 'Projet d\'arrete conjoint de creation',
  PRODOC: 'Document du projet valide',
  PROTOCOLE_ACCORD_ETAT_PARTENAIRE: 'Protocole d\'accord / convention de financement'
};

@Component({
  selector: 'app-idee-projet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './idee-projet-detail.component.html',
  styleUrl: './idee-projet-detail.component.scss'
})
export class IdeeProjetDetailComponent implements OnInit {
  private readonly maxImportFileSizeBytes = 10 * 1024 * 1024;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ideesService = inject(IdeesProjetService);
  private documentIdeeService = inject(DocumentIdeeService);
  private dossierProjetIdeeService = inject(DossierProjetIdeeService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private ciblesService = inject(CiblesService);
  private authService = inject(AuthService);
  private workflowService = inject(WorkflowService);
  private sourcesFinancementService = inject(SourcesFinancementService);
  private planFinancementIdeeProjetService = inject(PlanFinancementIdeeProjetService);

  idee = signal<IdeeProjet | null>(null);
  note = signal<Partial<IdeeProjetNoteConceptuelleResponse>>({});
  loading = signal(true);
  loadingNote = signal(false);
  importNoteModalOpen = signal(false);
  importingNote = signal(false);
  importBeneficiairesOpen = signal(false);
  error = signal<string | null>(null);
  documents = signal<DocumentIdeeProjetResponseDTO[]>([]);
  dossierProjet = signal<DossierProjetIdee | null>(null);
  sourcesFinancement = signal<SourceFinancement[]>([]);
  planFinancement = signal<PlanFinancementIdeeProjet[]>([]);
  loadingDocuments = signal(false);
  loadingDossierProjet = signal(false);
  loadingPlanFinancement = signal(false);
  documentsError = signal<string | null>(null);
  dossierProjetError = signal<string | null>(null);
  planFinancementError = signal<string | null>(null);
  actionComment = '';
  actionInProgress = signal(false);
  savingPlanFinancement = signal(false);
  editingPlanFinancementId = signal<string | null>(null);
  availableActions = signal<WorkflowNextAction[]>([]);
  requiredDocumentTypes = signal<TypeDocumentProjet[]>([]);
  selectedFiles: Partial<Record<TypeDocumentProjet, File>> = {};
  uploadingDocumentType = signal<TypeDocumentProjet | null>(null);
  activeDgepTab = signal<DgepWorkspaceTab>('synthese');
  planFinancementForm: {
    sourceFinancementId: string;
    modeFinancement: ModeFinancement | '';
    montant: number | null;
    pourcentage: number | null;
    statut: string;
    dateEngagement: string;
    actif: boolean;
  } = this.resetPlanFinancementForm();

  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  cibles = signal<Cible[]>([]);

  portees = [
    { value: 'NATIONALE', label: 'Nationale' },
    { value: 'REGIONALE', label: 'Régionale' },
    { value: 'PROVINCIALE', label: 'Provinciale' },
    { value: 'COMMUNALE', label: 'Communale' },
    { value: 'LOCALE', label: 'Locale' }
  ];

  modesFinancement = [
    { value: 'CONTREPARTIE' as ModeFinancement, label: 'Contrepartie' },
    { value: 'SUBVENTION' as ModeFinancement, label: 'Subvention' },
    { value: 'PRET' as ModeFinancement, label: 'Prêt' }
  ];

  statuts: { value: StatutIdeeProjet; label: string }[] = [
    { value: 'IDEE_BROUILLON', label: 'Brouillon' },
    { value: 'IDEE_SOUMISE', label: 'Soumise' },
    { value: 'IDEE_SOMMAIRE_SELECTIONNEE', label: 'Sommaire sélectionnée' },
    { value: 'IDEE_SOMMAIRE_REJETEE', label: 'Sommaire rejetée' },
    { value: 'IDEE_ARCHIVEE', label: 'Archivée' },
    { value: 'IDEE_CONCEPTION_BROUILLON', label: 'Conception brouillon' },
    { value: 'CONCEPTION_SOUMISE', label: 'Conception soumise' },
    { value: 'CONCEPTION_VALIDEE', label: 'Conception validée' },
    { value: 'RAPPORT_FAISABILITE_VALIDE', label: 'Faisabilité validée' },
    { value: 'PRODOC_SOUMIS', label: 'ProDoc soumis' },
    { value: 'PRODOC_VALIDE', label: 'ProDoc validé' },
    { value: 'AVIS_CNDP_FAVORABLE', label: 'Avis CNDP favorable' },
    { value: 'AVIS_CNDP_REJETE', label: 'Avis CNDP non favorable' },
    { value: 'IDENTIFICATION_FINANCEMENT', label: 'Financement identifié' },
    { value: 'SOUMISSION_DOSSIER_PROJET', label: 'Dossier projet soumis' },
    { value: 'DOSSIER_PROJET_VALIDE', label: 'Dossier projet validé' },
    { value: 'DOSSIER_PROJET_RETOURNE', label: 'Dossier projet retourné' }
  ];

  typesDocument: { value: TypeDocumentProjet; label: string }[] = [
    { value: 'NOTE_CONCEPTUELLE', label: 'Note conceptuelle' },
    { value: 'DEMANDE_CREATION_PROJET', label: 'Demande de creation de projet' },
    { value: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité' },
    { value: 'RAPPORT_FAISABILITE', label: 'Rapport de faisabilité' },
    { value: 'PRODOC', label: 'ProDoc' },
    { value: 'AVIS_CNDP', label: 'Avis CNDP' },
    { value: 'ACTE_JURIDIQUE', label: 'Acte juridique' },
    { value: 'PROJET_ARRETE_CONJOINT', label: 'Projet arrete conjoint' },
    { value: 'PROTOCOLE_ACCORD_ETAT_PARTENAIRE', label: 'Protocole accord Etat partenaire' },
    { value: 'DOSSIER_PROJET', label: 'Dossier projet' },
    { value: 'RAPPORT_TECHNIQUE', label: 'Rapport technique' },
    { value: 'PLAN_FINANCEMENT', label: 'Plan de financement' },
    { value: 'CAHIER_CHARGES', label: 'Cahier des charges' },
    { value: 'RAPPORT_AVANCEMENT', label: 'Rapport d\'avancement' },
    { value: 'PV_RECEPTION', label: 'PV de réception' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  selectedImportNoteFile = signal<File | null>(null);
  selectedImportCibleIds: string[] = [];
  importCibleSearch = '';
  importNoteModeFinancement: ModeFinancement | '' = '';

  readonly acceptedImportExtensions = ['.csv', '.xls', '.xlsx'];
  readonly noteConceptuelleImportColumns = [
    'contexte',
    'alignementStrategique',
    'resultatsAttendus',
    'indicateursPreliminaires',
    'descriptionSolution',
    'composantesProjet',
    'approcheMiseEnOeuvre',
    'contraintesRisques',
    'hypotheses',
    'prerequis',
    'chronogrammeSynthese',
    'impactSocioEconomique',
    'impactEnvironnementalSocial',
    'durabilite',
    'coutEstime',
    'dureeEstimeeMois'
  ];

  getIdeesListRoute(): string {
    return this.authService.hasRole('AGENT')
      ? '/app/maturation/mes-idees'
      : '/app/maturation/idees-projet';
  }

  isInstructionRole(): boolean {
    return this.authService.hasRole(['INSTRUCTEUR', 'INSTRUCTEUR_DGESS', 'DGESS']);
  }

  isCndpRole(): boolean {
    return this.authService.hasRole('CNDP');
  }

  isDgepRole(): boolean {
    return this.authService.hasRole('DGEP');
  }

  private isAgentRole(): boolean {
    return this.authService.hasRole('AGENT');
  }

  private isSameMinistere(): boolean {
    const currentMinistereId = this.authService.currentUser()?.ministereId;
    const itemMinistereId = this.idee()?.ministereId;
    return !!currentMinistereId && !!itemMinistereId && String(currentMinistereId) === String(itemMinistereId);
  }

  canValidateSommaire(): boolean {
    return this.isInstructionRole() && this.isSameMinistere() && this.idee()?.statut === 'IDEE_SOUMISE';
  }

  canValidateNoteConceptuelle(): boolean {
    return this.isInstructionRole()
      && this.isSameMinistere()
      && this.idee()?.statut === 'CONCEPTION_SOUMISE'
      && this.hasValidationNoteConceptuelleAction();
  }

  canEditNoteConceptuelle(): boolean {
    return !this.isInstructionRole() && this.idee()?.statut === 'IDEE_CONCEPTION_BROUILLON';
  }

  canDownloadNoteConceptuellePdf(): boolean {
    return this.idee()?.statut === 'CONCEPTION_VALIDEE';
  }

  canImportNoteConceptuelle(): boolean {
    return this.canEditNoteConceptuelle();
  }

  canValidateFaisabilite(): boolean {
    return this.isInstructionRole() && this.isSameMinistere() && this.idee()?.statut === 'CONCEPTION_VALIDEE';
  }

  canManageProdoc(): boolean {
    return this.isInstructionRole() && this.isSameMinistere();
  }

  canEmitCndpAvisFavorable(): boolean {
    return this.isCndpRole()
      && this.idee()?.statut === 'PRODOC_VALIDE'
      && this.hasCndpFavorableAction();
  }

  canEmitCndpAvisRejete(): boolean {
    return this.isCndpRole()
      && this.idee()?.statut === 'PRODOC_VALIDE'
      && this.hasCndpRejeteAction();
  }

  canManagePlanFinancement(): boolean {
    return this.isDgepRole() && this.isDgepEligibleStatus(this.idee()?.statut);
  }

  isDgepWorkspace(): boolean {
    return this.canManagePlanFinancement();
  }

  canAccessDgepFinancementTab(): boolean {
    return this.isDgepWorkspace();
  }

  canAccessDgepDossierTab(): boolean {
    return this.isDgepWorkspace() && this.idee()?.statut !== 'AVIS_CNDP_FAVORABLE';
  }

  setDgepTab(tab: DgepWorkspaceTab): void {
    this.activeDgepTab.set(tab);
  }

  private syncDgepTab(statut?: string): void {
    if (!this.isDgepRole()) {
      this.activeDgepTab.set('synthese');
      return;
    }

    if (statut === 'AVIS_CNDP_FAVORABLE') {
      this.activeDgepTab.set('financement');
      return;
    }

    if (this.isDossierProjetStatus(statut)) {
      this.activeDgepTab.set('dossier');
      return;
    }

    this.activeDgepTab.set('synthese');
  }

  showDgepSyntheseContent(): boolean {
    return !this.isDgepWorkspace() || this.activeDgepTab() === 'synthese';
  }

  showDgepFinancementContent(): boolean {
    return !this.isDgepWorkspace() || this.activeDgepTab() === 'financement';
  }

  showDgepDossierContent(): boolean {
    return !this.isDgepWorkspace() || this.activeDgepTab() === 'dossier';
  }

  shouldShowPlanFinancementSection(): boolean {
    return this.canManagePlanFinancement() && this.showDgepFinancementContent();
  }

  shouldShowDocumentsSection(): boolean {
    return !this.isDgepWorkspace() || this.showDgepDossierContent();
  }

  shouldShowActionsSection(): boolean {
    if (!this.isDgepWorkspace()) {
      return true;
    }

    const statut = this.idee()?.statut;
    if (statut === 'AVIS_CNDP_FAVORABLE') {
      return this.showDgepFinancementContent();
    }

    if (this.isDossierProjetStatus(statut)) {
      return this.showDgepDossierContent();
    }

    return this.showDgepSyntheseContent();
  }

  canIdentifierFinancement(): boolean {
    return this.canManagePlanFinancement()
      && this.idee()?.statut === 'AVIS_CNDP_FAVORABLE'
      && this.hasActivePlanFinancement()
      && this.hasIdentifierFinancementAction();
  }

  canSoumettreDossierProjet(): boolean {
    const statut = this.idee()?.statut;
    if (!this.canManageProdoc() || !this.isDossierProjetStatus(statut) || !this.hasRequiredDocuments()) {
      return false;
    }

    return this.hasDossierProjetSubmissionAction()
      || statut === 'IDENTIFICATION_FINANCEMENT'
      || statut === 'DOSSIER_PROJET_RETOURNE';
  }

  canValiderDossierProjet(): boolean {
    return this.canManagePlanFinancement()
      && this.idee()?.statut === 'SOUMISSION_DOSSIER_PROJET'
      && this.hasRequiredDocuments()
      && this.hasDossierProjetValidationAction();
  }

  canFinaliserDossierProjet(): boolean {
    return this.canValiderDossierProjet();
  }

  private hasValidationNoteConceptuelleAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'CONCEPTION_VALIDEE'
      || action.codeEtape === 'VALIDER_NOTE_CONCEPTUELLE'
      || action.nomEtape?.toLowerCase().includes('note conceptuelle')
    );
  }

  private hasCndpFavorableAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'AVIS_CNDP_FAVORABLE'
      || action.codeEtape === 'EMETTRE_AVIS_CNDP_FAVORABLE'
      || action.nomEtape?.toLowerCase().includes('avis cndp favorable')
    );
  }

  private hasCndpRejeteAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'AVIS_CNDP_REJETE'
      || action.codeEtape === 'EMETTRE_AVIS_CNDP_REJETE'
      || action.nomEtape?.toLowerCase().includes('avis cndp')
      || action.nomEtape?.toLowerCase().includes('non favorable')
      || action.nomEtape?.toLowerCase().includes('rejete')
    );
  }

  private hasIdentifierFinancementAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'IDENTIFICATION_FINANCEMENT'
      || action.codeEtape === 'IDENTIFICATION_FINANCEMENT'
      || action.nomEtape?.toLowerCase().includes('financement')
    );
  }

  private hasDossierProjetValidationAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'DOSSIER_PROJET_VALIDE'
      || action.codeEtape === 'DOSSIER_PROJET_VALIDE'
      || action.nomEtape?.toLowerCase().includes('dossier projet')
    );
  }

  private hasDossierProjetSubmissionAction(): boolean {
    return this.availableActions().some(action =>
      action.etatCible === 'SOUMISSION_DOSSIER_PROJET'
      || action.codeEtape === 'SOUMISSION_DOSSIER_PROJET'
      || action.nomEtape?.toLowerCase().includes('soumission dossier')
    );
  }

  ngOnInit(): void {
    this.loadMinisteres();
    this.loadSecteurs();
    this.loadCibles();
    this.loadSourcesFinancement();

    this.route.paramMap.subscribe(params => {
      const id = params.get('ididee') ?? params.get('id');
      if (!id) {
        this.error.set('Identifiant de l’idée de projet manquant.');
        this.loading.set(false);
        return;
      }
      this.loadIdee(id);
    });
  }

  private loadIdee(id: string): void {
    if (this.isAgentRole()) {
      const userId = this.authService.getTokenSubject();
      if (!userId) {
        this.error.set("Impossible d'identifier l'utilisateur courant.");
        this.loading.set(false);
        return;
      }

      this.ideesService.getMesIdees(userId).subscribe({
        next: (mesIdees) => {
          const hasAccess = mesIdees.some(item => String(item.id) === String(id));
          if (!hasAccess) {
            this.showToast("Vous n'avez pas accès à cette idée de projet.", 'error');
            this.router.navigate(['/app/maturation/mes-idees'], { replaceUrl: true });
            this.loading.set(false);
            return;
          }

          this.fetchIdee(id);
        },
        error: () => {
          this.error.set("Erreur lors de la vérification des droits d'accès.");
          this.loading.set(false);
        }
      });
      return;
    }

    this.fetchIdee(id);
  }

  openImportNoteConceptuelleModal(): void {
    if (!this.canImportNoteConceptuelle()) {
      this.showToast('Vous ne pouvez pas importer la note conceptuelle a ce statut.', 'error');
      return;
    }

    this.selectedImportNoteFile.set(null);
    this.selectedImportCibleIds = [...(this.note().cibleIds ?? [])];
    this.importCibleSearch = '';
    this.importNoteModeFinancement = this.note().modeFinancement ?? this.idee()?.modeFinancement ?? '';
    this.importBeneficiairesOpen.set(false);
    this.importNoteModalOpen.set(true);
  }

  closeImportNoteConceptuelleModal(fileInput?: HTMLInputElement): void {
    this.importNoteModalOpen.set(false);
    this.importBeneficiairesOpen.set(false);
    this.selectedImportNoteFile.set(null);
    this.selectedImportCibleIds = [];
    this.importCibleSearch = '';
    this.importNoteModeFinancement = '';
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onImportNoteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      this.selectedImportNoteFile.set(null);
      return;
    }

    const validationError = this.validateImportFile(file);
    if (validationError) {
      this.selectedImportNoteFile.set(null);
      if (input) {
        input.value = '';
      }
      this.showToast(validationError, 'error');
      return;
    }

    this.selectedImportNoteFile.set(file);
  }

  clearImportNoteFile(fileInput?: HTMLInputElement): void {
    this.selectedImportNoteFile.set(null);
    if (fileInput) {
      fileInput.value = '';
    }
  }

  toggleImportCibleSelection(cibleId: string): void {
    if (this.selectedImportCibleIds.includes(cibleId)) {
      this.selectedImportCibleIds = this.selectedImportCibleIds.filter(id => id !== cibleId);
      return;
    }

    this.selectedImportCibleIds = [...this.selectedImportCibleIds, cibleId];
  }

  removeImportSelectedCible(cibleId: string): void {
    this.selectedImportCibleIds = this.selectedImportCibleIds.filter(id => id !== cibleId);
  }

  isImportCibleSelected(cibleId: string): boolean {
    return this.selectedImportCibleIds.includes(cibleId);
  }

  toggleImportBeneficiairesOpen(): void {
    this.importBeneficiairesOpen.update(open => !open);
  }

  closeImportBeneficiairesOpen(): void {
    this.importBeneficiairesOpen.set(false);
  }

  getImportSelectedCibles(): Cible[] {
    return this.cibles().filter(cible => this.selectedImportCibleIds.includes(cible.id));
  }

  getFilteredImportCibles(): Cible[] {
    const term = this.importCibleSearch.trim().toLowerCase();
    if (!term) {
      return this.cibles();
    }

    return this.cibles().filter((cible) => this.getCibleLabel(cible).toLowerCase().includes(term));
  }

  downloadNoteConceptuelleImportTemplate(): void {
    const csvContent = `${this.noteConceptuelleImportColumns.join(';')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-import-note-conceptuelle.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async importNoteConceptuelleFromFile(fileInput?: HTMLInputElement): Promise<void> {
    const idee = this.idee();
    const file = this.selectedImportNoteFile();

    if (!idee || !file) {
      this.showToast('Selectionnez un fichier avant de lancer l\'import.', 'error');
      return;
    }

    if (this.selectedImportCibleIds.length === 0) {
      this.showToast('Selectionnez au moins une cible avant l\'import.', 'error');
      return;
    }

    if (!this.importNoteModeFinancement) {
      this.showToast('Selectionnez le mode de financement souhaite avant l\'import.', 'error');
      return;
    }

    this.importingNote.set(true);

    try {
      const row = await this.readImportNoteRow(file);
      const payload = this.buildImportedNotePayload(idee, row);

      this.ideesService.updateNoteConceptuelle(idee.id, payload).subscribe({
        next: (note) => {
          this.importingNote.set(false);
          this.note.set(note);
          this.closeImportNoteConceptuelleModal(fileInput);
          this.showToast('Note conceptuelle importee avec succes.', 'success');
        },
        error: () => {
          this.importingNote.set(false);
          this.showToast('Erreur lors de l\'import de la note conceptuelle.', 'error');
        }
      });
    } catch (error: any) {
      this.importingNote.set(false);
      this.showToast(error?.message || 'Impossible de lire le fichier de note conceptuelle.', 'error');
    }
  }

  private resetPlanFinancementForm() {
    return {
      sourceFinancementId: '',
      modeFinancement: '' as ModeFinancement | '',
      montant: null,
      pourcentage: null,
      statut: 'PREVISIONNEL',
      dateEngagement: '',
      actif: true
    };
  }

  private fetchIdee(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ideesService.getById(id).subscribe({
      next: (data) => {
        if (this.isCndpRole()
          && data.statut !== 'PRODOC_VALIDE'
          && data.statut !== 'AVIS_CNDP_FAVORABLE'
          && data.statut !== 'AVIS_CNDP_REJETE') {
          this.showToast("Vous n'avez pas accès à cette idée de projet.", 'error');
          this.router.navigate(['/app/maturation/idees-projet'], { replaceUrl: true });
          this.loading.set(false);
          return;
        }
        if (this.isDgepRole() && !this.isDgepEligibleStatus(data.statut)) {
          this.showToast("Vous n'avez pas accès à cette idée de projet.", 'error');
          this.router.navigate(['/app/maturation/idees-projet'], { replaceUrl: true });
          this.loading.set(false);
          return;
        }
        this.idee.set(data);
        this.syncDgepTab(data.statut);
        this.loading.set(false);
        this.requiredDocumentTypes.set(this.getRequiredDocumentTypes(data.statut));
        this.loadNoteConceptuelle(data.id);
        this.loadDocuments(data.id);
        this.loadDossierProjet(data.id, data.statut);
        this.loadPlanFinancement(data.id);
        this.loadAvailableActions(data.statut);
      },
      error: () => {
        this.error.set('Erreur lors du chargement de l’idée de projet.');
        this.loading.set(false);
      }
    });
  }

  private loadNoteConceptuelle(id: string | number): void {
    this.loadingNote.set(true);
    this.note.set({});
    this.ideesService.getNoteConceptuelle(id).subscribe({
      next: (note) => {
        this.note.set(note);
        this.loadingNote.set(false);
      },
      error: () => {
        this.loadingNote.set(false);
      }
    });
  }

  private loadDocuments(id: string | number): void {
    this.loadingDocuments.set(true);
    this.documentsError.set(null);
    this.documentIdeeService.getByIdeeProjet(String(id)).subscribe({
      next: (data) => {
        this.documents.set(data);
        this.loadingDocuments.set(false);
      },
      error: () => {
        this.documentsError.set('Erreur lors du chargement des documents.');
        this.loadingDocuments.set(false);
      }
    });
  }

  private loadDossierProjet(id: string | number, statut?: string): void {
    if (!this.isDossierProjetStatus(statut)) {
      this.dossierProjet.set(null);
      this.dossierProjetError.set(null);
      return;
    }

    this.loadingDossierProjet.set(true);
    this.dossierProjetError.set(null);
    this.dossierProjetIdeeService.getDossier(id).subscribe({
      next: (data) => {
        this.dossierProjet.set(data);
        this.loadingDossierProjet.set(false);
      },
      error: () => {
        this.dossierProjet.set(null);
        this.dossierProjetError.set('Erreur lors du chargement du dossier de projet.');
        this.loadingDossierProjet.set(false);
      }
    });
  }

  private loadSourcesFinancement(): void {
    this.sourcesFinancementService.getActifs().subscribe({
      next: (data) => this.sourcesFinancement.set(data),
      error: () => this.sourcesFinancement.set([])
    });
  }

  private loadPlanFinancement(id: string | number): void {
    this.loadingPlanFinancement.set(true);
    this.planFinancementError.set(null);
    this.planFinancementIdeeProjetService.getAll(id, true).subscribe({
      next: (data) => {
        this.planFinancement.set(data);
        this.loadingPlanFinancement.set(false);
      },
      error: () => {
        this.planFinancementError.set('Erreur lors du chargement du plan de financement.');
        this.loadingPlanFinancement.set(false);
      }
    });
  }

  private loadAvailableActions(statut?: string): void {
    if (!statut) {
      this.availableActions.set([]);
      return;
    }

    this.workflowService.getMyActions('IDEE_PROJET', statut).subscribe({
      next: (actions) => this.availableActions.set(actions),
      error: () => this.availableActions.set([])
    });
  }

  getRequiredDocumentTypes(statut?: string): TypeDocumentProjet[] {
    switch (statut) {
      case 'CONCEPTION_VALIDEE':
        return ['RAPPORT_FAISABILITE'];
      case 'RAPPORT_FAISABILITE_VALIDE':
        return ['PRODOC'];
      case 'PRODOC_SOUMIS':
        return ['PRODOC'];
      case 'PRODOC_VALIDE':
        return ['AVIS_CNDP'];
      case 'AVIS_CNDP_REJETE':
        return ['AVIS_CNDP'];
      case 'IDENTIFICATION_FINANCEMENT':
      case 'SOUMISSION_DOSSIER_PROJET':
      case 'DOSSIER_PROJET_RETOURNE':
        return DOSSIER_PROJET_REQUIRED_TYPES;
      default:
        return [];
    }
  }

  private loadCibles(): void {
    this.ciblesService.getAll().subscribe({
      next: (data) => this.cibles.set(data),
      error: () => {}
    });
  }

  private buildImportedNotePayload(
    idee: IdeeProjet,
    row: Record<string, string>
  ): IdeeProjetNoteConceptuelleRequest {
    const currentNote = this.note();

    return {
      ideeProjetId: idee.id,
      contexte: this.pickImportText(row, 'contexte', currentNote.contexte),
      alignementStrategique: this.pickImportText(row, 'alignementStrategique', currentNote.alignementStrategique),
      cibleIds: [...this.selectedImportCibleIds],
      beneficiairesEstimes: idee.beneficiairesEstimes ?? currentNote.beneficiairesEstimes,
      coutEstime: this.parseOptionalNumber(row['coutEstime'], currentNote.coutEstime, 'coutEstime'),
      resultatsAttendus: this.pickImportText(row, 'resultatsAttendus', currentNote.resultatsAttendus),
      indicateursPreliminaires: this.pickImportText(row, 'indicateursPreliminaires', currentNote.indicateursPreliminaires),
      descriptionSolution: this.pickImportText(row, 'descriptionSolution', currentNote.descriptionSolution),
      composantesProjet: this.pickImportText(row, 'composantesProjet', currentNote.composantesProjet),
      approcheMiseEnOeuvre: this.pickImportText(row, 'approcheMiseEnOeuvre', currentNote.approcheMiseEnOeuvre),
      contraintesRisques: this.pickImportText(row, 'contraintesRisques', currentNote.contraintesRisques),
      hypotheses: this.pickImportText(row, 'hypotheses', currentNote.hypotheses),
      prerequis: this.pickImportText(row, 'prerequis', currentNote.prerequis),
      modeFinancement: this.importNoteModeFinancement || undefined,
      dureeEstimeeMois: this.parseOptionalInteger(row['dureeEstimeeMois'], currentNote.dureeEstimeeMois, 'dureeEstimeeMois'),
      chronogrammeSynthese: this.pickImportText(row, 'chronogrammeSynthese', currentNote.chronogrammeSynthese),
      impactSocioEconomique: this.pickImportText(row, 'impactSocioEconomique', currentNote.impactSocioEconomique),
      impactEnvironnementalSocial: this.pickImportText(row, 'impactEnvironnementalSocial', currentNote.impactEnvironnementalSocial),
      durabilite: this.pickImportText(row, 'durabilite', currentNote.durabilite)
    };
  }

  private pickImportText(
    row: Record<string, string>,
    key: string,
    fallback?: string
  ): string | undefined {
    const value = row[key]?.trim();
    return value ? value : fallback;
  }

  private parseOptionalInteger(rawValue: string | undefined, fallback: number | undefined, field: string): number | undefined {
    const value = rawValue?.trim();
    if (!value) {
      return fallback;
    }

    if (!/^\d+$/.test(value)) {
      throw new Error(`La colonne ${field} doit contenir un nombre entier.`);
    }

    return Number(value);
  }

  private parseOptionalNumber(rawValue: string | undefined, fallback: number | undefined, field: string): number | undefined {
    const value = rawValue?.trim();
    if (!value) {
      return fallback;
    }

    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = Number(normalized);

    if (Number.isNaN(parsed)) {
      throw new Error(`La colonne ${field} doit contenir un nombre valide.`);
    }

    return parsed;
  }

  private async readImportNoteRow(file: File): Promise<Record<string, string>> {
    const extension = this.getFileExtension(file.name);

    if (extension === '.csv') {
      const text = await file.text();
      return this.parseCsvNoteRow(text);
    }

    if (extension === '.xls' || extension === '.xlsx') {
      return this.parseSpreadsheetNoteRow(file);
    }

    throw new Error('Format non autorise. Utilisez un fichier .csv, .xls ou .xlsx.');
  }

  private parseCsvNoteRow(content: string): Record<string, string> {
    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('Le fichier doit contenir un en-tete et au moins une ligne de donnees.');
    }

    const delimiter = this.detectCsvDelimiter(lines[0]);
    const headers = this.parseCsvLine(lines[0], delimiter).map(value => value.trim());
    const values = this.parseCsvLine(lines[1], delimiter);

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? '';
    });

    return row;
  }

  private async parseSpreadsheetNoteRow(file: File): Promise<Record<string, string>> {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false
    });

    if (rows.length === 0) {
      throw new Error('Le fichier ne contient aucune ligne de donnees.');
    }

    const rawRow = rows[0];
    const row: Record<string, string> = {};
    Object.keys(rawRow).forEach((key) => {
      row[key] = String(rawRow[key] ?? '').trim();
    });

    return row;
  }

  private detectCsvDelimiter(headerLine: string): ';' | ',' {
    const semicolons = (headerLine.match(/;/g) ?? []).length;
    const commas = (headerLine.match(/,/g) ?? []).length;
    return semicolons >= commas ? ';' : ',';
  }

  private parseCsvLine(line: string, delimiter: ';' | ','): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }

  private validateImportFile(file: File): string | null {
    if (file.size <= 0) {
      return 'Le fichier selectionne est vide.';
    }

    const extension = this.getFileExtension(file.name);
    if (!this.acceptedImportExtensions.includes(extension)) {
      return 'Format non autorise. Utilisez un fichier .csv, .xls ou .xlsx.';
    }

    if (file.size > this.maxImportFileSizeBytes) {
      return 'Le fichier depasse la taille maximale autorisee de 10 Mo.';
    }

    return null;
  }

  private getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
  }

  hasRequiredDocuments(): boolean {
    if (this.isDossierProjetStatus(this.idee()?.statut) && this.dossierProjet()) {
      return this.dossierProjet()?.complet === true;
    }

    return this.getMissingRequiredDocumentTypes().length === 0;
  }

  hasDocumentType(type: TypeDocumentProjet): boolean {
    if (this.isDossierProjetStatus(this.idee()?.statut) && this.isDossierProjetDocumentType(type)) {
      return this.hasDossierProjetDocument(type);
    }

    return this.getDocumentForType(type) !== null;
  }

  hasDossierProjetDocument(type: DossierProjetTypeDocument): boolean {
    return this.getDossierProjetDocumentForType(type) !== null;
  }

  getDossierProjetDocumentForType(type: DossierProjetTypeDocument): DossierProjetIdeeDocument | null {
    return this.dossierProjet()?.documents?.find(doc => doc.typeDocument === type) ?? null;
  }

  getDocumentForType(type: TypeDocumentProjet): DocumentIdeeProjetResponseDTO | null {
    const matchingDocuments = this.documents().filter(d => d.typeDocument === type);
    if (matchingDocuments.length === 0) {
      return null;
    }

    const activeDocument = matchingDocuments.find(d => d.actif !== false);
    if (activeDocument) {
      return activeDocument;
    }

    return matchingDocuments
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return dateB - dateA;
      })[0] ?? null;
  }

  getMissingRequiredDocumentTypes(): TypeDocumentProjet[] {
    if (this.isDossierProjetStatus(this.idee()?.statut) && this.dossierProjet()) {
      return this.dossierProjet()?.piecesManquantes ?? [];
    }

    return this.requiredDocumentTypes().filter(type => !this.hasDocumentType(type));
  }

  getRequiredDocumentsSummary(): string {
    return this.requiredDocumentTypes()
      .map(type => this.getTypeDocumentLabel(type))
      .join(', ');
  }

  startCreatePlanFinancement(): void {
    if (!this.canManagePlanFinancement()) {
      this.showToast('Seul le role DGEP peut gerer le plan de financement', 'error');
      return;
    }
    this.editingPlanFinancementId.set(null);
    this.planFinancementForm = this.resetPlanFinancementForm();
  }

  editPlanFinancement(line: PlanFinancementIdeeProjet): void {
    if (!this.canManagePlanFinancement()) {
      this.showToast('Seul le role DGEP peut gerer le plan de financement', 'error');
      return;
    }
    this.editingPlanFinancementId.set(line.id);
    this.planFinancementForm = {
      sourceFinancementId: line.sourceFinancementId,
      modeFinancement: line.modeFinancement,
      montant: line.montant,
      pourcentage: line.pourcentage ?? null,
      statut: line.statut ?? '',
      dateEngagement: line.dateEngagement ?? '',
      actif: line.actif ?? true
    };
  }

  cancelPlanFinancementEdit(): void {
    this.editingPlanFinancementId.set(null);
    this.planFinancementForm = this.resetPlanFinancementForm();
  }

  savePlanFinancement(): void {
    const item = this.idee();
    if (!item) return;
    if (!this.canManagePlanFinancement()) {
      this.showToast('Seul le role DGEP peut gerer le plan de financement', 'error');
      return;
    }

    if (!this.planFinancementForm.sourceFinancementId || !this.planFinancementForm.modeFinancement || this.planFinancementForm.montant === null) {
      this.showToast('Source, mode de financement et montant sont obligatoires', 'error');
      return;
    }

    if (this.hasDuplicatePlanLine(
      this.planFinancementForm.sourceFinancementId,
      this.planFinancementForm.modeFinancement,
      this.editingPlanFinancementId() ?? undefined
    )) {
      this.showToast('Cette source a déjà une ligne avec ce mode de financement.', 'error');
      return;
    }

    const payload: PlanFinancementIdeeProjetPayload = {
      sourceFinancementId: this.planFinancementForm.sourceFinancementId,
      modeFinancement: this.planFinancementForm.modeFinancement,
      montant: this.planFinancementForm.montant,
      pourcentage: this.planFinancementForm.pourcentage,
      statut: this.planFinancementForm.statut || null,
      dateEngagement: this.planFinancementForm.dateEngagement || null,
      actif: this.planFinancementForm.actif
    };

    this.savingPlanFinancement.set(true);
    const editingId = this.editingPlanFinancementId();
    const request$ = editingId
      ? this.planFinancementIdeeProjetService.update(item.id, editingId, payload)
      : this.planFinancementIdeeProjetService.create(item.id, payload);

    request$.subscribe({
      next: () => {
        this.savingPlanFinancement.set(false);
        this.cancelPlanFinancementEdit();
        this.loadPlanFinancement(item.id);
        this.showToast(editingId ? 'Ligne de financement mise à jour' : 'Ligne de financement ajoutée', 'success');
      },
      error: (err: any) => {
        this.savingPlanFinancement.set(false);
        const message = err?.message?.includes('deja')
          ? 'Cette source a déjà une ligne avec ce mode de financement.'
          : 'Erreur lors de l’enregistrement de la ligne de financement';
        this.showToast(message, 'error');
      }
    });
  }

  deletePlanFinancement(line: PlanFinancementIdeeProjet): void {
    const item = this.idee();
    if (!item) return;
    if (!this.canManagePlanFinancement()) {
      this.showToast('Seul le role DGEP peut gerer le plan de financement', 'error');
      return;
    }

    this.savingPlanFinancement.set(true);
    this.planFinancementIdeeProjetService.delete(item.id, line.id).subscribe({
      next: () => {
        this.savingPlanFinancement.set(false);
        if (this.editingPlanFinancementId() === line.id) {
          this.cancelPlanFinancementEdit();
        }
        this.loadPlanFinancement(item.id);
        this.showToast('Ligne de financement supprimée', 'success');
      },
      error: () => {
        this.savingPlanFinancement.set(false);
        this.showToast('Erreur lors de la suppression de la ligne de financement', 'error');
      }
    });
  }

  hasDuplicatePlanLine(sourceFinancementId: string, modeFinancement: ModeFinancement, currentId?: string): boolean {
    return this.planFinancement().some(line =>
      line.id !== currentId
      && line.sourceFinancementId === sourceFinancementId
      && line.modeFinancement === modeFinancement
    );
  }

  currentPlanFinancementHasDuplicate(): boolean {
    if (!this.planFinancementForm.sourceFinancementId || !this.planFinancementForm.modeFinancement) {
      return false;
    }

    return this.hasDuplicatePlanLine(
      this.planFinancementForm.sourceFinancementId,
      this.planFinancementForm.modeFinancement,
      this.editingPlanFinancementId() ?? undefined
    );
  }

  hasActivePlanFinancement(): boolean {
    return this.planFinancement().some(line => line.actif !== false);
  }

  getMissingRequiredDocumentsMessage(): string {
    const missing = this.getMissingRequiredDocumentTypes();
    if (missing.length === 0) {
      return '';
    }
    return `Dossier projet incomplet. Documents manquants : ${missing.map(type => this.getTypeDocumentLabel(type)).join(', ')}`;
  }

  isDossierProjetStatus(statut?: string): boolean {
    return statut === 'IDENTIFICATION_FINANCEMENT'
      || statut === 'SOUMISSION_DOSSIER_PROJET'
      || statut === 'DOSSIER_PROJET_RETOURNE';
  }

  onFileSelected(event: Event, type: TypeDocumentProjet): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles[type] = input.files && input.files[0] ? input.files[0] : undefined;
  }

  getSelectedFile(type: TypeDocumentProjet): File | null {
    return this.selectedFiles[type] ?? null;
  }

  uploadRequiredDocument(type: TypeDocumentProjet): void {
    const item = this.idee();
    const selectedFile = this.getSelectedFile(type);
    if (!item || !selectedFile || !this.canUploadDocumentType(type)) return;

    this.actionInProgress.set(true);
    this.uploadingDocumentType.set(type);
    this.documentIdeeService.upload(selectedFile, type, item.id, this.getUserId()).pipe(
      switchMap(() => this.isDossierProjetStatus(item.statut)
        ? this.dossierProjetIdeeService.synchroniser(item.id)
        : of(null)
      )
    ).subscribe({
      next: (dossier) => {
        this.actionInProgress.set(false);
        this.uploadingDocumentType.set(null);
        delete this.selectedFiles[type];
        if (dossier) {
          this.dossierProjet.set(dossier);
        }
        this.loadDocuments(item.id);
        this.showToast(`${this.getTypeDocumentLabel(type)} telecharge avec succes`, 'success');
      },
      error: () => {
        this.actionInProgress.set(false);
        this.uploadingDocumentType.set(null);
        this.showToast(`Erreur lors du telechargement de ${this.getTypeDocumentLabel(type)}`, 'error');
      }
    });
  }

  canUploadDocumentType(type: TypeDocumentProjet): boolean {
    if (this.isDossierProjetStatus(this.idee()?.statut) && this.isDossierProjetDocumentType(type)) {
      return this.canManageProdoc() && this.dossierProjet()?.statut !== 'VALIDE';
    }

    if (type === 'AVIS_CNDP' && !this.isCndpRole()) {
      return false;
    }

    if ((type === 'RAPPORT_FAISABILITE' || type === 'PRODOC') && !this.canManageProdoc()) {
      return false;
    }

    if (this.isDgepEligibleStatus(this.idee()?.statut)) {
      const dgepDocuments: TypeDocumentProjet[] = [
        ...DOSSIER_PROJET_REQUIRED_TYPES
      ];
      if (dgepDocuments.includes(type) && !this.canManageProdoc()) {
        return false;
      }
    }

    return !this.hasDocumentType(type);
  }

  onSoumettreDossierProjet(): void {
    const item = this.idee();
    if (!item) return;
    if (!this.canSoumettreDossierProjet()) {
      this.showToast('Seul l\'instructeur du ministere peut soumettre le dossier a cette etape', 'error');
      return;
    }

    const missing = this.getMissingRequiredDocumentTypes();
    if (missing.length > 0) {
      this.showToast(this.getMissingRequiredDocumentsMessage(), 'error');
      return;
    }

    this.actionInProgress.set(true);
    this.ideesService.soumettreDossierProjet(item.id, this.buildActionPayload()).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.showToast('Dossier de creation de projet soumis a la DGEP avec succes', 'success');
        this.refreshIdee(item.id);
      },
      error: (err: any) => {
        this.actionInProgress.set(false);
        this.handleDossierError(err);
      }
    });
  }

  onValiderDossierProjet(): void {
    const item = this.idee();
    if (!item) return;
    if (!this.canValiderDossierProjet()) {
      this.showToast('Seul le role DGEP peut traiter le dossier a cette etape', 'error');
      return;
    }

    if (item.statut !== 'SOUMISSION_DOSSIER_PROJET') {
      this.showToast('Impossible de valider : l\'idee n\'est pas en SOUMISSION_DOSSIER_PROJET.', 'error');
      return;
    }

    this.actionInProgress.set(true);
    this.ideesService.validerDossierProjet(item.id, this.buildActionPayload()).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.showToast('Dossier valide. Le projet a ete cree automatiquement.', 'success');
        this.refreshIdee(item.id, () => this.router.navigate(['/app/pip/projets']));
      },
      error: (err: any) => {
        this.actionInProgress.set(false);
        this.handleDossierError(err);
      }
    });
  }

  private handleDossierError(err: any): void {
    const apiError = err?.error;
    if (apiError?.code === 'DOSSIER_PROJET_INCOMPLET') {
      const missingTypes = Array.isArray(apiError?.details?.missingTypes)
        ? apiError.details.missingTypes
        : [];
      const missingLabels = missingTypes.length > 0
        ? missingTypes.map((type: TypeDocumentProjet) => this.getTypeDocumentLabel(type)).join(', ')
        : this.getMissingRequiredDocumentTypes().map(type => this.getTypeDocumentLabel(type)).join(', ');
      this.showToast(`Dossier projet incomplet. Documents manquants : ${missingLabels}`, 'error');
      return;
    }
    if (err?.status === 403) {
      this.showToast(
        'Vous n\'avez pas la permission d\'executer cette action. Veuillez contacter l\'administrateur de la plateforme.',
        'error'
      );
      return;
    }
    this.showToast(apiError?.message || err?.message || 'Erreur lors du traitement du dossier projet', 'error');
  }

  // ── Actions dédiées par statut ──────────────────────────────────────────

  onSoumettre(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.soumettre(item.id, {}),
      'Idée soumise avec succès'
    );
  }

  downloadFicheIdentification(): void {
    const item = this.idee();
    if (!item) return;
    this.ideesService.downloadFicheIdentificationPdfAndSave(item.id);
  }

  onValiderSommaire(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.validerSommaire(item.id, this.buildActionPayload()),
      'Sommaire validé avec succès'
    );
  }

  onRejeterSommaire(): void {
    if (!this.actionComment.trim()) {
      this.showToast('Un commentaire est obligatoire pour le rejet', 'error');
      return;
    }
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.rejeterSommaire(item.id, this.buildActionPayload()),
      'Sommaire rejeté'
    );
  }

  onDemarrerNoteConceptuelle(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.demarrerNoteConceptuelle(item.id, this.buildActionPayload()),
      'Rédaction de la note conceptuelle démarrée'
    );
  }

  onSoumettreNoteConceptuelle(): void {
    const item = this.idee();
    if (!item) return;

    const n = this.note();
    const champsManquants: string[] = [];

    if (!n.contexte?.trim())            champsManquants.push('Contexte');
    if (!n.resultatsAttendus?.trim())   champsManquants.push('Resultats attendus');
    if (!n.descriptionSolution?.trim()) champsManquants.push('Description de la solution');

    if (champsManquants.length > 0) {
      this.showToast(
        `Note conceptuelle incomplète. Champs requis : ${champsManquants.join(', ')}.`,
        'error'
      );
      return;
    }

    this.runAction(
      this.ideesService.soumettreNoteConceptuelle(item.id, this.buildActionPayload()),
      'Note conceptuelle soumise avec succès'
    );
  }

  onValiderNoteConceptuelle(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.validerNoteConceptuelle(item.id, { userId: this.getUserId() }),
      'Note conceptuelle validée avec succès'
    );
  }

  onValiderFaisabilite(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.validerFaisabilite(item.id, this.buildActionPayload()),
      'Rapport de faisabilité validé'
    );
  }

  downloadNoteConceptuellePdf(): void {
    const item = this.idee();
    if (!item || !this.canDownloadNoteConceptuellePdf()) return;
    this.ideesService.downloadNoteConceptuellePdfAndSave(item.id);
  }

  onSoumettreProdoc(): void {
    if (!this.canManageProdoc()) {
      this.showToast('Seul l’instructeur peut televerser et soumettre le ProDoc', 'error');
      return;
    }
    if (!this.hasRequiredDocuments()) {
      this.showToast('Document ProDoc requis avant la soumission', 'error');
      return;
    }
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.soumettreProdoc(item.id, this.buildActionPayload()),
      'Document de projet soumis avec succès'
    );
  }

  onValiderProdoc(): void {
    const item = this.idee();
    if (!item) return;
    if (!this.canManageProdoc()) {
      this.showToast('Seul l’instructeur peut valider le ProDoc', 'error');
      return;
    }
    this.runAction(
      this.ideesService.validerProdoc(item.id, this.buildActionPayload()),
      'Document de projet validé'
    );
  }

  onEmettreAvisCndpFavorable(): void {
    const item = this.idee();
    if (!item || !this.canEmitCndpAvisFavorable()) return;

    if (!this.hasDocumentType('AVIS_CNDP')) {
      this.showToast("Le document AVIS_CNDP est obligatoire avant d'émettre un avis favorable", 'error');
      return;
    }

    this.runAction(
      this.ideesService.emettreAvisCndpFavorable(item.id, { userId: this.getUserId() }),
      'Avis CNDP favorable émis avec succès'
    );
  }

  onEmettreAvisCndpRejete(): void {
    const item = this.idee();
    if (!item || !this.canEmitCndpAvisRejete()) return;

    if (!this.hasDocumentType('AVIS_CNDP')) {
      this.showToast("Le document AVIS_CNDP est obligatoire avant d'émettre un avis non favorable", 'error');
      return;
    }

    if (!this.actionComment.trim()) {
      this.showToast('Un commentaire est obligatoire pour un avis CNDP non favorable', 'error');
      return;
    }

    this.runAction(
      this.ideesService.emettreAvisCndpRejete(item.id, this.buildActionPayload()),
      'Avis CNDP non favorable émis avec succès'
    );
  }

  onIdentifierFinancement(): void {
    if (!this.canIdentifierFinancement()) {
      this.showToast('Seul le role DGEP peut identifier le financement a cette etape', 'error');
      return;
    }
    if (!this.hasActivePlanFinancement()) {
      this.showToast('Au moins une ligne active du plan de financement est requise avant cette action', 'error');
      return;
    }
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.identifierFinancement(item.id, this.buildActionPayload()),
      'Identification du financement validée avec succès'
    );
  }

  onRetournerDossierProjet(): void {
    if (!this.canValiderDossierProjet()) {
      this.showToast('Seul le role DGEP peut retourner le dossier a cette etape', 'error');
      return;
    }
    if (!this.actionComment.trim()) {
      this.showToast('Un commentaire est obligatoire pour retourner le dossier', 'error');
      return;
    }
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.retournerDossierProjet(item.id, this.buildActionPayload()),
      'Dossier retourné avec observations'
    );
  }

  private runAction(call: Observable<any>, successMessage: string): void {
    const item = this.idee();
    if (!item) return;
    this.actionInProgress.set(true);
    call.subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.showToast(successMessage, 'success');
        this.refreshIdee(item.id);
      },
      error: (err: any) => {
        this.actionInProgress.set(false);
        this.showToast(err?.message || 'Erreur lors de l\'exécution de l\'action', 'error');
      }
    });
  }

  private refreshIdee(id: string | number, afterRefresh?: () => void): void {
    this.ideesService.getById(id).subscribe({
      next: (updated) => {
        this.idee.set(updated);
        this.syncDgepTab(updated.statut);
        this.requiredDocumentTypes.set(this.getRequiredDocumentTypes(updated.statut));
        this.loadNoteConceptuelle(updated.id);
        this.loadDocuments(updated.id);
        this.loadDossierProjet(updated.id, updated.statut);
        this.loadPlanFinancement(updated.id);
        this.loadAvailableActions(updated.statut);
        afterRefresh?.();
      },
      error: () => {}
    });
  }

  private buildActionPayload(): { userId?: string; commentaire?: string } {
    const commentaire = this.actionComment.trim();
    return {
      userId: this.getUserId(),
      commentaire: commentaire ? commentaire : undefined
    };
  }

  private getUserId(): string | undefined {
    return this.authService.currentUser()?.id;
  }

  private isDgepEligibleStatus(statut?: string): boolean {
    return statut === 'AVIS_CNDP_FAVORABLE'
      || statut === 'IDENTIFICATION_FINANCEMENT'
      || statut === 'SOUMISSION_DOSSIER_PROJET'
      || statut === 'DOSSIER_PROJET_RETOURNE';
  }

  private isDossierProjetDocumentType(type: TypeDocumentProjet): type is DossierProjetTypeDocument {
    return DOSSIER_PROJET_REQUIRED_TYPES.includes(type);
  }

  private loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
  }

  private loadSecteurs(): void {
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  getPorteeLabel(value: string | undefined): string {
    if (!value) return '-';
    return this.portees.find(p => p.value === value)?.label || value;
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-gray';
    const classes: Record<string, string> = {
      'IDEE_BROUILLON': 'badge-gray',
      'IDEE_SOUMISE': 'badge-info',
      'IDEE_SOMMAIRE_SELECTIONNEE': 'badge-primary',
      'IDEE_SOMMAIRE_REJETEE': 'badge-danger',
      'IDEE_ARCHIVEE': 'badge-gray',
      'IDEE_CONCEPTION_BROUILLON': 'badge-warning',
      'CONCEPTION_SOUMISE': 'badge-info',
      'CONCEPTION_VALIDEE': 'badge-primary',
      'RAPPORT_FAISABILITE_VALIDE': 'badge-success',
      'PRODOC_SOUMIS': 'badge-info',
      'PRODOC_VALIDE': 'badge-success',
      'AVIS_CNDP_FAVORABLE': 'badge-success',
      'AVIS_CNDP_REJETE': 'badge-danger',
      'IDENTIFICATION_FINANCEMENT': 'badge-warning',
      'SOUMISSION_DOSSIER_PROJET': 'badge-info',
      'DOSSIER_PROJET_VALIDE': 'badge-success',
      'DOSSIER_PROJET_RETOURNE': 'badge-danger'
    };
    return classes[statut] || 'badge-gray';
  }

  getNoteField(key: string): string | number | undefined {
    const value = (this.note() as Record<string, unknown>)[key];

    if (key === 'modeFinancement') {
      return this.getModeFinancementLabel(value as ModeFinancement | null | undefined);
    }

    if (key === 'cibleIds' && Array.isArray(value)) {
      const labels = value
        .map(id => this.cibles().find(cible => cible.id === id))
        .filter((cible): cible is Cible => !!cible)
        .map(cible => cible.libelle || cible.nom || `${cible.annee ?? ''}`)
        .filter(label => !!label);
      return labels.length > 0 ? labels.join(', ') : undefined;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return typeof value === 'string' || typeof value === 'number'
      ? value
      : undefined;
  }

  getTypeDocumentLabel(type: TypeDocumentProjet): string {
    if (this.isDossierProjetDocumentType(type)) {
      return DOSSIER_DOCUMENT_LABELS[type];
    }

    const found = this.typesDocument.find(t => t.value === type);
    return found ? found.label : type;
  }

  getModeFinancementLabel(value: ModeFinancement | null | undefined): string {
    switch (value) {
      case 'CONTREPARTIE':
        return 'Contrepartie';
      case 'SUBVENTION':
        return 'Subvention';
      case 'PRET':
        return 'Prêt';
      default:
        return '';
    }
  }

  getCibleLabel(cible: Cible): string {
    return cible.libelle || cible.nom || `${cible.annee ?? ''}` || '-';
  }

  getSourceFinancementLabel(id: string | undefined): string {
    if (!id) return '-';
    const source = this.sourcesFinancement().find(item => item.id === id);
    return source ? source.nom : '-';
  }

  getDocumentStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getDecisionBadgeClass(decision: string): string {
    switch (decision) {
      case 'FAVORABLE': return 'badge-success';
      case 'DEFAVORABLE': return 'badge-danger';
      case 'ACCEPTE': return 'badge-success';
      case 'REFUSE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  downloadDocument(item: DocumentIdeeProjetResponseDTO): void {
    this.documentIdeeService.downloadAndSave(item.id, item.titre);
  }

  downloadDossierProjetDocument(type: DossierProjetTypeDocument): void {
    const document = this.getDossierProjetDocumentForType(type);
    if (!document?.documentIdeeProjetId) return;

    this.documentIdeeService.downloadAndSave(
      document.documentIdeeProjetId,
      document.titre || this.getTypeDocumentLabel(type)
    );
  }

  downloadRequiredDocument(type: TypeDocumentProjet): void {
    if (this.isDossierProjetStatus(this.idee()?.statut) && this.isDossierProjetDocumentType(type)) {
      this.downloadDossierProjetDocument(type);
      return;
    }

    const document = this.getDocumentForType(type);
    if (document) {
      this.downloadDocument(document);
    }
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}

