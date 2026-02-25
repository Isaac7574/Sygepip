import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationsService } from '@core/services/evaluations.service';
import { ProjetsService } from '@core/services/projets.service';
import { RapportEvaluation, Projet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './evaluations.component.html',
  styleUrl: './evaluations.component.scss'
})
export class ÉvaluationsComponent implements OnInit {
  private evaluationsService = inject(EvaluationsService);
  private projetsService = inject(ProjetsService);

  items = signal<RapportEvaluation[]>([]);
  filteredItems = signal<RapportEvaluation[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<RapportEvaluation | null>(null);
  saving = signal(false);
  formData: Partial<RapportEvaluation> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: RapportEvaluation | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesEvaluation = [
    { value: 'MI_PARCOURS', label: 'Mi-parcours' },
    { value: 'FINALE', label: 'Finale' },
    { value: 'EX_POST', label: 'Ex-post' },
    { value: 'IMPACT', label: 'Impact' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadProjets();
  }

  private resetForm(): Partial<RapportEvaluation> {
    return { projetId: undefined, typeEvaluation: 'MI_PARCOURS', dateEvaluation: undefined, evaluateur: '', noteGlobale: undefined, pointsForts: '', pointsFaibles: '', recommandations: '', fichierRapportUrl: '' };
  }

  load(): void {
    this.evaluationsService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement', 'error')
    });
  }

  loadProjets(): void {
    this.projetsService.getAll().subscribe({ next: (data) => this.projets.set(data) });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.evaluateur?.toLowerCase().includes(term) || i.typeEvaluation?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: RapportEvaluation): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.projetId || !this.formData.typeEvaluation) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.evaluationsService.update(this.editingItem()!.id, this.formData)
      : this.evaluationsService.create(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Évaluation modifiée avec succès' : 'Évaluation créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: RapportEvaluation): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'évaluation';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer cette évaluation ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.evaluationsService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Évaluation supprimée avec succès', 'success'); },
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

  getProjetNom(id: number | undefined): string {
    if (!id) return '-';
    const p = this.projets().find(p => p.id === id);
    return p ? p.titre : '-';
  }

  getTypeLabel(value: string): string {
    return this.typesEvaluation.find(t => t.value === value)?.label || value;
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'MI_PARCOURS': return 'badge-info';
      case 'FINALE': return 'badge-success';
      case 'EX_POST': return 'badge-warning';
      case 'IMPACT': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
