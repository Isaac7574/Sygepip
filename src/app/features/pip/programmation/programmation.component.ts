import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgrammationService } from '@core/services/programmation.service';
import { PipAnnuel } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-programmation',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './programmation.component.html',
  styleUrl: './programmation.component.scss'
})
export class ProgrammationComponent implements OnInit {
  private programmationService = inject(ProgrammationService);

  items = signal<PipAnnuel[]>([]);
  filteredItems = signal<PipAnnuel[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<PipAnnuel | null>(null);
  saving = signal(false);
  formData: Partial<PipAnnuel> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: PipAnnuel | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  statuts = [
    { value: 'PREPARATION', label: 'Préparation' },
    { value: 'VALIDATION', label: 'Validation' },
    { value: 'EXECUTION', label: 'Exécution' },
    { value: 'CLOTURE', label: 'Clôturé' }
  ];

  ngOnInit(): void { this.load(); }

  private resetForm(): Partial<PipAnnuel> {
    return { code: '', annee: new Date().getFullYear(), statut: 'PREPARATION', enveloppeGlobale: undefined, dateOuverture: undefined, dateCloture: undefined, observations: '', actif: true };
  }

  load(): void {
    this.programmationService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.code?.toLowerCase().includes(term) || i.annee?.toString().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: PipAnnuel): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.code || !this.formData.annee) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.programmationService.update(this.editingItem()!.id, this.formData)
      : this.programmationService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Programmation modifiée avec succès' : 'Programmation créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: PipAnnuel): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer la programmation';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer la programmation "${item.code}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.programmationService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Programmation supprimée avec succès', 'success'); },
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

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'PREPARATION': 'badge-secondary',
      'VALIDATION': 'badge-info',
      'EXECUTION': 'badge-warning',
      'CLOTURE': 'badge-success'
    };
    return classes[statut] || 'badge-secondary';
  }

  formatMontant(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }
}
