import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { DocumentIdeeService } from '@core/services/document-idee.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { CiblesService } from '@core/services/cibles.service';
import { AuthService } from '@core/services/auth.service';
import {
  Cible,
  IdeeProjet,
  IdeeProjetNoteConceptuelleResponse,
  Ministere,
  Secteur,
  DocumentIdeeProjetResponseDTO,
  TypeDocumentProjet,
  StatutIdeeProjet
} from '@core/models';
import { ToastComponent } from '@shared/components/toast/toast.component';

const DOSSIER_PROJET_REQUIRED_TYPES: TypeDocumentProjet[] = [
  'DEMANDE_CREATION_PROJET',
  'PROJET_ARRETE_CONJOINT',
  'PROTOCOLE_ACCORD_ETAT_PARTENAIRE',
  'PRODOC'
];

@Component({
  selector: 'app-idee-projet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './idee-projet-detail.component.html',
  styleUrl: './idee-projet-detail.component.scss'
})
export class IdeeProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ideesService = inject(IdeesProjetService);
  private documentIdeeService = inject(DocumentIdeeService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private ciblesService = inject(CiblesService);
  private authService = inject(AuthService);

  idee = signal<IdeeProjet | null>(null);
  note = signal<Partial<IdeeProjetNoteConceptuelleResponse>>({});
  loading = signal(true);
  loadingNote = signal(false);
  error = signal<string | null>(null);
  documents = signal<DocumentIdeeProjetResponseDTO[]>([]);
  loadingDocuments = signal(false);
  documentsError = signal<string | null>(null);
  actionComment = '';
  actionInProgress = signal(false);
  requiredDocumentTypes = signal<TypeDocumentProjet[]>([]);
  selectedFiles: Partial<Record<TypeDocumentProjet, File>> = {};
  uploadingDocumentType = signal<TypeDocumentProjet | null>(null);

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

  statuts: { value: StatutIdeeProjet; label: string }[] = [
    { value: 'IDEE_BROUILLON', label: 'Brouillon' },
    { value: 'IDEE_SOUMISE', label: 'Soumise' },
    { value: 'IDEE_SOMMAIRE_SELECTIONNEE', label: 'Sommaire sélectionnée' },
    { value: 'IDEE_SOMMAIRE_REJETEE', label: 'Sommaire rejetée' },
    { value: 'IDEE_ARCHIVEE', label: 'Archivée' },
    { value: 'IDEE_CONCEPTION_BROUILLON', label: 'Conception brouillon' },
    { value: 'CONCEPTION_SOUMISE', label: 'Conception soumise' },
    { value: 'RAPPORT_FAISABILITE_VALIDE', label: 'Faisabilité validée' },
    { value: 'PRODOC_SOUMIS', label: 'ProDoc soumis' },
    { value: 'PRODOC_VALIDE', label: 'ProDoc validé' },
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

  ngOnInit(): void {
    this.loadMinisteres();
    this.loadSecteurs();
    this.loadCibles();

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
    this.loading.set(true);
    this.error.set(null);
    this.ideesService.getById(id).subscribe({
      next: (data) => {
        this.idee.set(data);
        this.loading.set(false);
        this.requiredDocumentTypes.set(this.getRequiredDocumentTypes(data.statut));
        this.loadNoteConceptuelle(data.id);
        this.loadDocuments(data.id);
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

  getRequiredDocumentTypes(statut?: string): TypeDocumentProjet[] {
    switch (statut) {
      case 'CONCEPTION_SOUMISE':
        return ['RAPPORT_FAISABILITE'];
      case 'RAPPORT_FAISABILITE_VALIDE':
        return ['PRODOC'];
      case 'PRODOC_SOUMIS':
        return ['PRODOC'];
      case 'PRODOC_VALIDE':
        return ['ACTE_JURIDIQUE'];
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

  hasRequiredDocuments(): boolean {
    return this.getMissingRequiredDocumentTypes().length === 0;
  }

  hasDocumentType(type: TypeDocumentProjet): boolean {
    return this.getDocumentForType(type) !== null;
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
    return this.requiredDocumentTypes().filter(type => !this.hasDocumentType(type));
  }

  getRequiredDocumentsSummary(): string {
    return this.requiredDocumentTypes()
      .map(type => this.getTypeDocumentLabel(type))
      .join(', ');
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
    if (!item || !selectedFile) return;

    this.actionInProgress.set(true);
    this.uploadingDocumentType.set(type);
    this.documentIdeeService.upload(selectedFile, type, item.id, this.getUserId()).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.uploadingDocumentType.set(null);
        delete this.selectedFiles[type];
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
    return !this.hasDocumentType(type);
  }

  onSoumettreDossierProjet(): void {
    const item = this.idee();
    if (!item) return;

    const missing = this.getMissingRequiredDocumentTypes();
    if (missing.length > 0) {
      this.showToast(this.getMissingRequiredDocumentsMessage(), 'error');
      return;
    }

    this.actionInProgress.set(true);
    this.ideesService.soumettreDossierProjet(item.id, this.buildActionPayload()).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.showToast('Dossier de creation de projet soumis avec succes', 'success');
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
      this.ideesService.soumettre(item.id, this.buildActionPayload()),
      'Idée soumise avec succès'
    );
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

  onValiderFaisabilite(): void {
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.validerFaisabilite(item.id, this.buildActionPayload()),
      'Rapport de faisabilité validé'
    );
  }

  onSoumettreProdoc(): void {
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
    this.runAction(
      this.ideesService.validerProdoc(item.id, this.buildActionPayload()),
      'Document de projet validé'
    );
  }

  onIdentifierFinancement(): void {
    if (!this.hasRequiredDocuments()) {
      this.showToast('Acte juridique requis avant cette action', 'error');
      return;
    }
    const item = this.idee();
    if (!item) return;
    this.runAction(
      this.ideesService.identifierFinancement(item.id, this.buildActionPayload()),
      'Financement identifié avec succès'
    );
  }

  onRetournerDossierProjet(): void {
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
        this.requiredDocumentTypes.set(this.getRequiredDocumentTypes(updated.statut));
        this.loadDocuments(updated.id);
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
      'RAPPORT_FAISABILITE_VALIDE': 'badge-success',
      'PRODOC_SOUMIS': 'badge-info',
      'PRODOC_VALIDE': 'badge-success',
      'IDENTIFICATION_FINANCEMENT': 'badge-warning',
      'SOUMISSION_DOSSIER_PROJET': 'badge-info',
      'DOSSIER_PROJET_VALIDE': 'badge-success',
      'DOSSIER_PROJET_RETOURNE': 'badge-danger'
    };
    return classes[statut] || 'badge-gray';
  }

  getNoteField(key: string): string | number | undefined {
    const value = (this.note() as Record<string, unknown>)[key];

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
    const found = this.typesDocument.find(t => t.value === type);
    return found ? found.label : type;
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

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
