import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { DocumentIdeeService } from '@core/services/document-idee.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { WorkflowService } from '@core/services/workflow.service';
import { AuthService } from '@core/services/auth.service';
import {
  IdeeProjet,
  IdeeProjetNoteConceptuelle,
  Ministere,
  Secteur,
  DocumentIdeeProjetResponseDTO,
  TypeDocumentProjet,
  WorkflowNextAction,
  WorkflowActionCode,
  StatutIdeeProjet
} from '@core/models';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-idee-projet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './idee-projet-detail.component.html',
  styleUrl: './idee-projet-detail.component.scss'
})
export class IdeeProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ideesService = inject(IdeesProjetService);
  private documentIdeeService = inject(DocumentIdeeService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private workflowService = inject(WorkflowService);
  private authService = inject(AuthService);

  idee = signal<IdeeProjet | null>(null);
  note = signal<Partial<IdeeProjetNoteConceptuelle>>({});
  loading = signal(true);
  loadingNote = signal(false);
  error = signal<string | null>(null);
  documents = signal<DocumentIdeeProjetResponseDTO[]>([]);
  loadingDocuments = signal(false);
  documentsError = signal<string | null>(null);
  workflowActions = signal<WorkflowNextAction[]>([]);
  loadingActions = signal(false);
  actionComment = '';
  actionInProgress = signal(false);
  requiredDocumentType = signal<TypeDocumentProjet | null>(null);
  selectedFile: File | null = null;

  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);

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
    { value: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité' },
    { value: 'RAPPORT_FAISABILITE', label: 'Rapport de faisabilité' },
    { value: 'PRODOC', label: 'ProDoc' },
    { value: 'ACTE_JURIDIQUE', label: 'Acte juridique' },
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
        this.requiredDocumentType.set(this.getRequiredDocumentType(data.statut));
        this.loadWorkflowActions(data);
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

  private loadWorkflowActions(item: IdeeProjet): void {
    if (!item.statut) return;
    this.loadingActions.set(true);
    this.workflowService.getNextActions('IDEE_PROJET', String(item.statut)).subscribe({
      next: (actions) => { this.workflowActions.set(actions); this.loadingActions.set(false); },
      error: () => { this.loadingActions.set(false); }
    });
  }

  getRequiredDocumentType(statut?: string): TypeDocumentProjet | null {
    switch (statut) {
      case 'CONCEPTION_SOUMISE':
        return 'RAPPORT_FAISABILITE';
      case 'RAPPORT_FAISABILITE_VALIDE':
        return 'PRODOC';
      case 'PRODOC_SOUMIS':
        return 'PRODOC';
      case 'PRODOC_VALIDE':
        return 'ACTE_JURIDIQUE';
      case 'IDENTIFICATION_FINANCEMENT':
        return 'DOSSIER_PROJET';
      case 'SOUMISSION_DOSSIER_PROJET':
        return 'DOSSIER_PROJET';
      default:
        return null;
    }
  }

  hasRequiredDocument(): boolean {
    const required = this.requiredDocumentType();
    if (!required) return true;
    return this.documents().some(d => d.typeDocument === required);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files[0] ? input.files[0] : null;
  }

  uploadRequiredDocument(): void {
    const item = this.idee();
    const required = this.requiredDocumentType();
    if (!item || !required || !this.selectedFile) return;
    this.actionInProgress.set(true);
    this.documentIdeeService.upload(this.selectedFile, required, item.id, this.getUserId()).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.selectedFile = null;
        this.loadDocuments(item.id);
        this.showToast('Document téléchargé avec succès', 'success');
      },
      error: () => {
        this.actionInProgress.set(false);
        this.showToast('Erreur lors du téléchargement du document', 'error');
      }
    });
  }

  executeWorkflowAction(action: WorkflowNextAction): void {
    const item = this.idee();
    if (!item) return;
    const payload = this.buildActionPayload();
    if (this.actionRequiresComment(action.actionCode) && !payload.commentaire) {
      this.showToast('Un commentaire est obligatoire pour cette action', 'error');
      return;
    }
    if (!this.hasRequiredDocument()) {
      this.showToast('Document requis absent pour cette transition', 'error');
      return;
    }
    const obs = this.resolveActionCall(item, action.actionCode, payload);
    if (!obs) {
      this.showToast('Action non supportée pour ce statut', 'error');
      return;
    }
    this.actionInProgress.set(true);
    obs.subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.showToast('Action effectuée avec succès', 'success');
        this.ideesService.getById(item.id).subscribe({
          next: (updated) => {
            this.idee.set(updated);
            this.requiredDocumentType.set(this.getRequiredDocumentType(updated.statut));
            this.loadWorkflowActions(updated);
            this.loadDocuments(updated.id);
          },
          error: () => {}
        });
      },
      error: () => {
        this.actionInProgress.set(false);
        this.showToast('Erreur lors de l\'exécution de l\'action', 'error');
      }
    });
  }

  private resolveActionCall(
    item: IdeeProjet,
    actionCode: WorkflowActionCode,
    payload: { userId?: string; commentaire?: string }
  ) {
    const statut = String(item.statut || '');
    switch (statut) {
      case 'IDEE_BROUILLON':
        return this.ideesService.soumettre(item.id, payload);
      case 'IDEE_SOUMISE':
        return actionCode === 'REJETER'
          ? this.ideesService.rejeterSommaire(item.id, payload)
          : this.ideesService.validerSommaire(item.id, payload);
      case 'IDEE_SOMMAIRE_SELECTIONNEE':
        return this.ideesService.demarrerNoteConceptuelle(item.id, payload);
      case 'IDEE_CONCEPTION_BROUILLON':
        return this.ideesService.soumettreNoteConceptuelle(item.id, payload);
      case 'CONCEPTION_SOUMISE':
        return this.ideesService.validerFaisabilite(item.id, payload);
      case 'RAPPORT_FAISABILITE_VALIDE':
        return this.ideesService.soumettreProdoc(item.id, payload);
      case 'PRODOC_SOUMIS':
        return this.ideesService.validerProdoc(item.id, payload);
      case 'PRODOC_VALIDE':
        return this.ideesService.identifierFinancement(item.id, payload);
      case 'IDENTIFICATION_FINANCEMENT':
        return this.ideesService.soumettreDossierProjet(item.id, payload);
      case 'SOUMISSION_DOSSIER_PROJET':
        return actionCode === 'RETOUR'
          ? this.ideesService.retournerDossierProjet(item.id, payload)
          : this.ideesService.validerDossierProjet(item.id, payload);
      default:
        return null;
    }
  }

  getActionLabel(action: WorkflowNextAction): string {
    const labels: Record<WorkflowActionCode, string> = {
      SOUMETTRE: 'Soumettre',
      RESOUMETTRE: 'Resoumettre',
      VALIDER: 'Valider',
      RETOUR: 'Retourner',
      REJETER: 'Rejeter',
      PASSER_ETAPE: 'Passer étape',
      ARCHIVER: 'Archiver',
      CREER_PROJET: 'Créer projet',
      CLOTURER: 'Clôturer',
      RETENIR: 'Retenir',
      NON_RETENIR: 'Non retenir',
      INSCRIRE_PIP: 'Inscrire PIP'
    };
    return labels[action.actionCode] || action.actionCode;
  }

  getActionButtonClass(actionCode: WorkflowActionCode): string {
    if (actionCode === 'REJETER' || actionCode === 'RETOUR') {
      return 'btn-outline text-bf-red-600 border-bf-red-600';
    }
    if (actionCode === 'VALIDER' || actionCode === 'SOUMETTRE' || actionCode === 'RESOUMETTRE') {
      return 'btn-primary';
    }
    return 'btn-outline';
  }

  canShowAction(action: WorkflowNextAction): boolean {
    if (!action.roleRequis) return true;
    const roles = action.roleRequis.split(/[,\\s]+/).filter(Boolean);
    if (roles.length === 0) return true;
    return this.authService.hasRole(roles);
  }

  actionRequiresComment(actionCode: WorkflowActionCode): boolean {
    return actionCode === 'REJETER' || actionCode === 'RETOUR';
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
    return (this.note() as Record<string, string | number | undefined>)[key];
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
