import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertesService } from '@core/services/alertes.service';
import { ProjetsService } from '@core/services/projets.service';
import { Alerte, Projet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-alertes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './alertes.component.html',
  styleUrl: './alertes.component.scss'
})
export class AlertesComponent implements OnInit {
  private alertesService = inject(AlertesService);
  private projetsService = inject(ProjetsService);

  items = signal<Alerte[]>([]);
  filteredItems = signal<Alerte[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Alerte | null>(null);
  saving = signal(false);
  formData: Partial<Alerte> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Alerte | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesAlerte = [
    { value: 'RETARD', label: 'Retard' },
    { value: 'DEPASSEMENT_BUDGET', label: 'Dépassement budget' },
    { value: 'QUALITE', label: 'Qualité' },
    { value: 'RISQUE', label: 'Risque' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  niveaux = [
    { value: 'INFO', label: 'Information' },
    { value: 'WARNING', label: 'Avertissement' },
    { value: 'CRITICAL', label: 'Critique' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadProjets();
  }

  private resetForm(): Partial<Alerte> {
    return { projetId: undefined, typeAlerte: 'AUTRE', niveau: 'INFO', message: '', dateAlerte: undefined, traitee: false, actionPrise: '' };
  }

  load(): void {
    this.alertesService.getAll().subscribe({
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
      i.typeAlerte?.toLowerCase().includes(term) || i.message?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Alerte): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.projetId || !this.formData.message) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.alertesService.update(this.editingItem()!.id, this.formData)
      : this.alertesService.create(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Alerte modifiée avec succès' : 'Alerte créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: Alerte): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'alerte';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer cette alerte ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.alertesService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Alerte supprimée avec succès', 'success'); },
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

  toggleTraitee(item: Alerte): void {
    this.alertesService.update(item.id, { ...item, traitee: !item.traitee }).subscribe({
      next: () => { this.load(); this.showToast('Statut mis à jour', 'success'); },
      error: () => this.showToast('Erreur lors de la mise à jour', 'error')
    });
  }

  getProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const p = this.projets().find(p => String(p.id) === String(id));
    return p ? p.titre : '-';
  }

  getTypeLabel(value: string): string {
    return this.typesAlerte.find(t => t.value === value)?.label || value;
  }

  getNiveauLabel(value: string): string {
    return this.niveaux.find(n => n.value === value)?.label || value;
  }

  getNiveauBadgeClass(niveau: string): string {
    switch (niveau) {
      case 'INFO': return 'badge-info';
      case 'WARNING': return 'badge-warning';
      case 'CRITICAL': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
