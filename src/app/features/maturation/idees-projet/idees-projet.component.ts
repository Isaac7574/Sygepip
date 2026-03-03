import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { IdeeProjet, IdeeProjetNoteConceptuelle, Ministere, Secteur } from '@core/models';
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

  items = signal<IdeeProjet[]>([]);
  filteredItems = signal<IdeeProjet[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  searchTerm = '';

  // Modal principal
  modalOpen = signal(false);
  editingItem = signal<IdeeProjet | null>(null);
  saving = signal(false);
  formData: Partial<IdeeProjet> = this.resetForm();
  private pendingEditId: string | null = null;
  private pendingNoteId: string | null = null;

  // Modal Note Conceptuelle
  noteModalOpen = signal(false);
  selectedItemForNote: IdeeProjet | null = null;
  noteData: Partial<IdeeProjetNoteConceptuelle> = this.resetNoteForm();
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

  statuts = [
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'SOUMIS', label: 'Soumis' },
    { value: 'EN_EVALUATION', label: 'En évaluation' },
    { value: 'VALIDE', label: 'Validé' },
    { value: 'REJETE', label: 'Rejeté' }
  ];

  ngOnInit(): void {
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
    this.loadMinisteres();
    this.loadSecteurs();
  }

  private resetForm(): Partial<IdeeProjet> {
    return {
      code: '',
      titre: '',
      description: '',
      ministereId: undefined,
      secteurId: undefined,
      portee: 'NATIONALE',
      regionsIntervention: '',
      pointFocalNom: '',
      pointFocalEmail: '',
      pointFocalTelephone: ''
    };
  }

  private resetNoteForm(): Partial<IdeeProjetNoteConceptuelle> {
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
    this.ideesService.getAll().subscribe({
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
      ministereId: item.ministereId,
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
    if (!this.formData.code || !this.formData.titre || !this.formData.ministereId) {
      this.showToast('Veuillez remplir tous les champs obligatoires (code, titre, ministère)', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.ideesService.update(this.editingItem()!.id, this.formData)
      : this.ideesService.create(this.formData);

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
    this.noteModalOpen.set(true);
    // Charger les données depuis l'API (le endpoint liste peut ne pas retourner les champs de la note)
    this.ideesService.getNoteConceptuelle(item.id).subscribe({
      next: (note) => { this.noteData = { ...note }; },
      error: () => {} // Formulaire vide si pas encore de note
    });
  }

  closeNoteModal(): void {
    this.noteModalOpen.set(false);
    this.selectedItemForNote = null;
  }

  saveNoteConceptuelle(): void {
    if (!this.selectedItemForNote) return;
    this.savingNote.set(true);
    const noteWithId: IdeeProjetNoteConceptuelle = {
      ...(this.noteData as IdeeProjetNoteConceptuelle),
      ideeProjetId: this.selectedItemForNote.id
    };
    this.ideesService.updateNoteConceptuelle(this.selectedItemForNote.id, noteWithId).subscribe({
      next: () => {
        this.savingNote.set(false);
        this.closeNoteModal();
        this.load();
        this.showToast('Note conceptuelle mise à jour avec succès', 'success');
      },
      error: () => {
        this.savingNote.set(false);
        this.showToast('Erreur lors de la mise à jour de la note conceptuelle', 'error');
      }
    });
  }

  confirmDelete(item: IdeeProjet): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'idée de projet';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer l'idée "${item.titre}" ?`;
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
      'BROUILLON': 'badge-gray',
      'SOUMIS': 'badge-info',
      'EN_EVALUATION': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return classes[statut] || 'badge-gray';
  }
}
