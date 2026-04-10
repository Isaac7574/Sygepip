import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { CiblesService } from '@core/services/cibles.service';
import { AuthService } from '@core/services/auth.service';
import {
  Cible,
  IdeeProjet,
  IdeeProjetNoteConceptuelleRequest,
  IdeeProjetNoteConceptuelleResponse,
  Ministere,
  Secteur,
  StatutIdeeProjet
} from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-idees-de-projet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './idees-projet.component.html',
  styleUrl: './idees-projet.component.scss'
})
export class IdeesdeProjetComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ideesService = inject(IdeesProjetService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private ciblesService = inject(CiblesService);
  private authService = inject(AuthService);

  items = signal<IdeeProjet[]>([]);
  filteredItems = signal<IdeeProjet[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  cibles = signal<Cible[]>([]);
  searchTerm = '';
  isMesIdeesMode = false;

  // Modal principal
  modalOpen = signal(false);
  editingItem = signal<IdeeProjet | null>(null);
  saving = signal(false);
  formData: Partial<IdeeProjet> = this.resetForm();
  private pendingEditId: string | null = null;
  private pendingNoteId: string | null = null;

  // Modal Vue (lecture seule)
  viewModalOpen = signal(false);
  viewingItem = signal<IdeeProjet | null>(null);
  viewNote = signal<Partial<IdeeProjetNoteConceptuelleResponse>>({});
  loadingNote = signal(false);

  // Modal Note Conceptuelle
  noteModalOpen = signal(false);
  selectedItemForNote: IdeeProjet | null = null;
  noteData: Partial<IdeeProjetNoteConceptuelleResponse> = this.resetNoteForm();
  selectedCibleIds: string[] = [];
  beneficiairesOpen = signal(false);
  savingNote = signal(false);

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: IdeeProjet | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  portees = [
    { value: 'NATIONALE', label: 'Nationale' },
    { value: 'REGIONALE', label: 'Régionale' },
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

  ngOnInit(): void {
    this.isMesIdeesMode = this.route.snapshot.data['mode'] === 'mes-idees';
    this.route.queryParamMap.subscribe(params => {
      const editId = params.get('editId');
      const noteId = params.get('noteId');
      this.pendingEditId = editId;
      this.pendingNoteId = noteId;
      if (editId && this.items().length > 0) {
        this.openEditById(editId);
      }
      if (noteId && this.items().length > 0) {
        this.openNoteById(noteId);
      }
    });
    this.load();
    this.loadSecteurs();
    this.loadCibles();
  }

  private resetForm(): Partial<IdeeProjet> {
    return {
      code: '',
      titre: '',
      description: '',
      problematique: '',
      objectifGeneral: '',
      objectifsSpecifiques: '',
      beneficiairesEstimes: undefined,
      secteurId: undefined,
      portee: 'NATIONALE',
      statut: 'IDEE_BROUILLON',
      actif: true,
      regionsIntervention: '',
      pointFocalNom: '',
      pointFocalEmail: '',
      pointFocalTelephone: ''
    };
  }

  private resetNoteForm(): Partial<IdeeProjetNoteConceptuelleResponse> {
    return {
      contexte: '',
      alignementStrategique: '',
      resultatsAttendus: '',
      indicateursPreliminaires: '',
      descriptionSolution: '',
      composantesProjet: '',
      approcheMiseEnOeuvre: '',
      contraintesRisques: '',
      hypotheses: '',
      prerequis: '',
      sourcesFinancementEnvisagees: '',
      chronogrammeSynthese: '',
      impactSocioEconomique: '',
      impactEnvironnementalSocial: '',
      durabilite: ''
    };
  }

  load(): void {
    const request$ = this.isMesIdeesMode ? this.getMesIdeesRequest() : this.ideesService.getAll();

    request$.subscribe({
      next: (data) => {
        this.items.set(data);
        this.filteredItems.set(data);
        if (this.pendingEditId) {
          this.openEditById(this.pendingEditId);
        }
        if (this.pendingNoteId) {
          this.openNoteById(this.pendingNoteId);
        }
      },
      error: () => this.showToast('Erreur lors du chargement des données', 'error')
    });
  }

  private getMesIdeesRequest(): Observable<IdeeProjet[]> {
    const userId = this.authService.getTokenSubject();
    if (!userId) {
      this.showToast("Impossible d'identifier l'utilisateur courant", 'error');
      return of([]);
    }

    return this.ideesService.getMesIdees(userId);
  }

  getPageTitle(): string {
    return this.isMesIdeesMode ? 'Mes idées' : 'Idées de Projet';
  }

  getPageDescription(): string {
    return this.isMesIdeesMode
      ? 'Liste de vos idées de projet'
      : 'Gestion des idées de projet et maturation';
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => this.showToast('Impossible de charger la liste des ministères', 'error')
    });
  }

  loadSecteurs(): void {
    this.secteursService.getAll().subscribe({
      next: (data) => this.secteurs.set(data),
      error: () => this.showToast('Impossible de charger la liste des secteurs', 'error')
    });
  }

  loadCibles(): void {
    this.ciblesService.getAll().subscribe({
      next: (data) => this.cibles.set(data),
      error: () => this.showToast('Impossible de charger la liste des cibles', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  view(item: IdeeProjet): void {
    this.viewingItem.set(item);
    this.viewNote.set({});
    this.viewModalOpen.set(true);
    this.loadingNote.set(true);
    this.ideesService.getNoteConceptuelle(item.id).subscribe({
      next: (note) => { this.viewNote.set(note); this.loadingNote.set(false); },
      error: () => { this.loadingNote.set(false); }
    });
  }

  closeView(): void {
    this.viewModalOpen.set(false);
    this.viewingItem.set(null);
    this.viewNote.set({});
  }

  getNoteField(key: string): string | number | undefined {
    const value = (this.viewNote() as Record<string, unknown>)[key];

    if (key === 'cibleIds' && Array.isArray(value)) {
      const labels = value
        .map(id => this.cibles().find(cible => cible.id === id))
        .filter((cible): cible is Cible => !!cible)
        .map(cible => this.getCibleLabel(cible));
      return labels.length > 0 ? labels.join(', ') : undefined;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return typeof value === 'string' || typeof value === 'number'
      ? value
      : undefined;
  }

  private openEditById(id: string): void {
    const item = this.items().find(i => String(i.id) === String(id));
    if (item) {
      this.edit(item);
      this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
      this.pendingEditId = null;
    }
  }

  private openNoteById(id: string): void {
    const item = this.items().find(i => String(i.id) === String(id));
    if (item) {
      this.openNoteConceptuelle(item);
      this.router.navigate([], { queryParams: { noteId: null }, queryParamsHandling: 'merge' });
      this.pendingNoteId = null;
    }
  }

  edit(item: IdeeProjet): void {
    this.formData = {
      code: item.code,
      titre: item.titre,
      description: item.description,
      problematique: item.problematique,
      objectifGeneral: item.objectifGeneral,
      objectifsSpecifiques: item.objectifsSpecifiques,
      beneficiairesEstimes: item.beneficiairesEstimes,
      ministereId: item.ministereId,
      ministereNom: item.ministereNom,
      secteurId: item.secteurId,
      portee: item.portee,
      regionsIntervention: item.regionsIntervention,
      pointFocalNom: item.pointFocalNom,
      pointFocalEmail: item.pointFocalEmail,
      pointFocalTelephone: item.pointFocalTelephone
    };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.code || !this.formData.titre || !this.formData.secteurId) {
      this.showToast('Veuillez remplir tous les champs obligatoires (code, titre, secteur)', 'error');
      return;
    }

    this.saving.set(true);
    const payload: Partial<IdeeProjet> = {
      code: this.formData.code,
      titre: this.formData.titre,
      description: this.formData.description,
      ministereTutelleFinanciereId: this.formData.ministereTutelleFinanciereId,
      secteurId: this.formData.secteurId,
      portee: this.formData.portee,
      statut: this.formData.statut || 'IDEE_BROUILLON',
      actif: this.formData.actif ?? true,
      problematique: this.formData.problematique,
      objectifGeneral: this.formData.objectifGeneral,
      objectifsSpecifiques: this.formData.objectifsSpecifiques,
      beneficiairesCibles: this.formData.beneficiairesCibles,
      beneficiairesEstimes: this.formData.beneficiairesEstimes,
      zoneIntervention: this.formData.zoneIntervention,
      coutEstime: this.formData.coutEstime,
      dureeEstimeeMois: this.formData.dureeEstimeeMois,
      porteurProjet: this.formData.porteurProjet,
      pointFocalNom: this.formData.pointFocalNom,
      pointFocalEmail: this.formData.pointFocalEmail,
      pointFocalTelephone: this.formData.pointFocalTelephone,
      dateSoumission: this.formData.dateSoumission
    };

    const obs = this.editingItem()
      ? this.ideesService.update(this.editingItem()!.id, payload)
      : this.ideesService.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          this.editingItem() ? 'Idée de projet modifiée avec succès' : 'Idée de projet créée avec succès',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // Note Conceptuelle
  openNoteConceptuelle(item: IdeeProjet): void {
    this.selectedItemForNote = item;
    this.noteData = this.resetNoteForm();
    this.selectedCibleIds = [];
    this.noteModalOpen.set(true);
    // Charger les données depuis l'API (le endpoint liste peut ne pas retourner les champs de la note)
    forkJoin({
      cibles: this.ciblesService.getAll(),
      note: this.ideesService.getNoteConceptuelle(item.id)
    }).subscribe({
      next: ({ cibles, note }) => {
        this.cibles.set(cibles);
        this.noteData = { ...note };
        this.selectedCibleIds = note.cibleIds ?? [];
      },
      error: () => {
        this.selectedCibleIds = [];
      }
    });
  }

  closeNoteModal(): void {
    this.noteModalOpen.set(false);
    this.selectedItemForNote = null;
    this.selectedCibleIds = [];
    this.beneficiairesOpen.set(false);
  }

  toggleBeneficiairesOpen(): void {
    this.beneficiairesOpen.update(open => !open);
  }

  closeBeneficiairesOpen(): void {
    this.beneficiairesOpen.set(false);
  }

  toggleCibleSelection(cibleId: string): void {
    if (this.selectedCibleIds.includes(cibleId)) {
      this.selectedCibleIds = this.selectedCibleIds.filter(id => id !== cibleId);
      return;
    }

    this.selectedCibleIds = [...this.selectedCibleIds, cibleId];
  }

  removeSelectedCible(cibleId: string): void {
    this.selectedCibleIds = this.selectedCibleIds.filter(id => id !== cibleId);
  }

  isCibleSelected(cibleId: string): boolean {
    return this.selectedCibleIds.includes(cibleId);
  }

  getSelectedCibles(): Cible[] {
    return this.cibles().filter(cible => this.selectedCibleIds.includes(cible.id));
  }

  getCibleLabel(cible: Cible): string {
    const rawLabel = cible.libelle || cible.nom || `${cible.annee}`;
    return this.normalizeDisplayText(rawLabel);
  }

  formatNoteTitle(code?: string, titre?: string): string {
    const safeCode = this.normalizeDisplayText(code || '');
    const safeTitre = this.normalizeDisplayText(titre || '');
    return [safeCode, safeTitre].filter(Boolean).join(' - ');
  }

  private normalizeDisplayText(value: string): string {
    return value
      .replaceAll('??', '')
      .replaceAll('??', 'é')
      .replaceAll('?¨', 'è')
      .replaceAll('?a', 'ê')
      .replaceAll('??', '?')
      .replaceAll('? ', 'à')
      .replaceAll('?￠', 'a')
      .replaceAll('??', '?')
      .replaceAll('?′', '?')
      .replaceAll('?1', 'ù')
      .replaceAll('??', '?')
      .replaceAll('?§', '?')
      .replaceAll('?‰', 'é')
      .replaceAll('?€', 'à')
      .replaceAll('a€?', "'")
      .replaceAll('a€?', '"')
      .replaceAll('a€?', '"')
      .replaceAll('a€"', '-')
      .replaceAll('a€“', '-')
      .replaceAll('a€”', '-')
      .replaceAll('B??n??ficiaires', 'Bénéficiaires')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  saveNoteConceptuelle(): void {
    if (!this.selectedItemForNote) return;
    this.savingNote.set(true);
    const noteWithId: IdeeProjetNoteConceptuelleRequest = {
      ideeProjetId: this.selectedItemForNote.id,
      contexte: this.noteData.contexte,
      alignementStrategique: this.noteData.alignementStrategique,
      cibleIds: this.selectedCibleIds,
      resultatsAttendus: this.noteData.resultatsAttendus,
      indicateursPreliminaires: this.noteData.indicateursPreliminaires,
      descriptionSolution: this.noteData.descriptionSolution,
      composantesProjet: this.noteData.composantesProjet,
      approcheMiseEnOeuvre: this.noteData.approcheMiseEnOeuvre,
      contraintesRisques: this.noteData.contraintesRisques,
      hypotheses: this.noteData.hypotheses,
      prerequis: this.noteData.prerequis,
      beneficiairesEstimes: this.noteData.beneficiairesEstimes,
      coutEstime: this.noteData.coutEstime,
      sourcesFinancementEnvisagees: this.noteData.sourcesFinancementEnvisagees,
      dureeEstimeeMois: this.noteData.dureeEstimeeMois,
      chronogrammeSynthese: this.noteData.chronogrammeSynthese,
      impactSocioEconomique: this.noteData.impactSocioEconomique,
      impactEnvironnementalSocial: this.noteData.impactEnvironnementalSocial,
      durabilite: this.noteData.durabilite
    };
    const ideeId = this.selectedItemForNote.id;
    this.ideesService.updateNoteConceptuelle(ideeId, noteWithId).subscribe({
      next: () => {
        this.savingNote.set(false);
        this.closeNoteModal();
        this.load();
        this.showToast('Note conceptuelle mise a jour avec succes', 'success');
      },
      error: () => {
        this.savingNote.set(false);
        this.showToast('Erreur lors de la mise a jour de la note conceptuelle', 'error');
      }
    });
  }

  confirmDelete(item: IdeeProjet): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = "Supprimer l'idee de projet";
    this.confirmDialogMessage = `Voulez-vous supprimer l'idee "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.ideesService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Idée de projet supprimée avec succès', 'success');
        },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
    }
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getIdeeMinistereLabel(item: Partial<IdeeProjet> | null | undefined): string {
    if (!item) return '-';
    if (item.ministereNom) {
      return item.ministereNom;
    }
    return this.getMinistereNom(item.ministereId);
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
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
}


