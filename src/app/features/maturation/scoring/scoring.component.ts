import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoringService } from '@core/services/scoring.service';
import { CritereSelection } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-scoring',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './scoring.component.html',
  styleUrl: './scoring.component.scss'
})
export class ScoringComponent implements OnInit {
  private scoringService = inject(ScoringService);

  items = signal<CritereSelection[]>([]);
  filteredItems = signal<CritereSelection[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<CritereSelection | null>(null);
  saving = signal(false);
  formData: Partial<CritereSelection> = { code: '', nom: '', description: '', categorie: '', poids: 1, valeurMin: 0, valeurMax: 10, actif: true };

  // Form validation
  formErrors = signal<{ code?: string; nom?: string }>({});

  // Confirm dialog state
  confirmDialogVisible = signal(false);
  confirmDialogTitle = 'Confirmer la suppression';
  confirmDialogMessage = '';
  itemToDelete = signal<CritereSelection | null>(null);

  // Toast state
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.scoringService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {
        this.showToast('Erreur lors du chargement des critères de scoring.', 'error');
      }
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term) || i.categorie?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', description: '', categorie: '', poids: 1, valeurMin: 0, valeurMax: 10, actif: true };
    this.formErrors.set({});
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: CritereSelection): void {
    this.formData = { ...item };
    this.formErrors.set({});
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  validateForm(): boolean {
    const errors: { code?: string; nom?: string } = {};

    if (!this.formData.code || this.formData.code.trim() === '') {
      errors.code = 'Le code est obligatoire.';
    }
    if (!this.formData.nom || this.formData.nom.trim() === '') {
      errors.nom = 'Le nom est obligatoire.';
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving.set(true);
    const isEdit = !!this.editingItem();
    const obs = isEdit
      ? this.scoringService.update(this.editingItem()!.id, this.formData)
      : this.scoringService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          isEdit ? 'Critère modifié avec succès.' : 'Critère créé avec succès.',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast(
          isEdit ? 'Erreur lors de la modification du critère.' : 'Erreur lors de la création du critère.',
          'error'
        );
      }
    });
  }

  confirmDelete(item: CritereSelection): void {
    this.itemToDelete.set(item);
    this.confirmDialogMessage = `Voulez-vous vraiment supprimer le critère "${item.nom}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    const item = this.itemToDelete();
    this.confirmDialogVisible.set(false);
    if (!item) return;

    this.scoringService.delete(item.id).subscribe({
      next: () => {
        this.load();
        this.showToast('Critère supprimé avec succès.', 'success');
      },
      error: () => {
        this.showToast('Erreur lors de la suppression du critère.', 'error');
      }
    });
    this.itemToDelete.set(null);
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.itemToDelete.set(null);
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }

  onToastClose(): void {
    this.toastVisible.set(false);
  }
}
