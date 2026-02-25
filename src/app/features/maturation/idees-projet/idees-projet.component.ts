import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeeProjet, Ministere, Secteur, Region, Programme } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-idees-de-projet',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './idees-projet.component.html',
  styleUrl: './idees-projet.component.scss'
})
export class IdeesdeProjetComponent implements OnInit {
  private ideesService = inject(IdeesProjetService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);

  items = signal<IdeeProjet[]>([]);
  filteredItems = signal<IdeeProjet[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<IdeeProjet | null>(null);
  saving = signal(false);
  formData: Partial<IdeeProjet> = this.resetForm();

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: IdeeProjet | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  categories = [
    { value: 'NOUVEAU', label: 'Nouveau' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EXTENSION', label: 'Extension' },
    { value: 'REHABILITATION', label: 'Réhabilitation' }
  ];

  priorites = [
    { value: 'HAUTE', label: 'Haute' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'BASSE', label: 'Basse' }
  ];

  statuts = [
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'SOUMIS', label: 'Soumis' },
    { value: 'EN_EVALUATION', label: 'En évaluation' },
    { value: 'VALIDE', label: 'Validé' },
    { value: 'REJETE', label: 'Rejeté' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadMinisteres();
    this.loadSecteurs();
    this.loadRegions();
    this.loadProgrammes();
  }

  private resetForm(): Partial<IdeeProjet> {
    return { code: '', titre: '', description: '', categorie: 'NOUVEAU', priorite: 'MOYENNE', coutEstime: undefined, dureeEstimee: undefined, beneficiaires: '', objectifs: '', resultatsAttendus: '', ministereId: undefined, secteurId: undefined, regionId: undefined, programmeId: undefined, statut: 'BROUILLON' };
  }

  load(): void {
    this.ideesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des données', 'error')
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
  }

  loadSecteurs(): void {
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
  }

  loadRegions(): void {
    this.regionsService.getAll().subscribe({ next: (data) => this.regions.set(data) });
  }

  loadProgrammes(): void {
    this.programmesService.getAll().subscribe({ next: (data) => this.programmes.set(data) });
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

  edit(item: IdeeProjet): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.code || !this.formData.titre || !this.formData.ministereId) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
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
        this.showToast(this.editingItem() ? 'Idée de projet modifiée avec succès' : 'Idée de projet créée avec succès', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
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

  getRegionNom(id: string | number | undefined): string {
    if (!id) return '-';
    const r = this.regions().find(r => String(r.id) === String(id));
    return r ? r.nom : '-';
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'BROUILLON': 'badge-secondary',
      'SOUMIS': 'badge-info',
      'EN_EVALUATION': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  getPrioriteLabel(priorite: string | undefined): string {
    if (!priorite) return '-';
    return this.priorites.find(p => p.value === priorite)?.label || priorite;
  }

  getPrioriteBadgeClass(priorite: string | undefined): string {
    if (!priorite) return 'badge-secondary';
    const classes: Record<string, string> = {
      'HAUTE': 'badge-danger',
      'MOYENNE': 'badge-warning',
      'BASSE': 'badge-info'
    };
    return classes[priorite] || 'badge-secondary';
  }

  formatCout(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }
}
