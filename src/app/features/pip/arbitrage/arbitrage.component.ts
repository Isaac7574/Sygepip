import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArbitrageService } from '@core/services/arbitrage.service';
import { ProjetsService } from '@core/services/projets.service';
import { AutorisationEngagement, Projet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-arbitrage',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './arbitrage.component.html',
  styleUrl: './arbitrage.component.scss'
})
export class ArbitrageComponent implements OnInit {
  private arbitrageService = inject(ArbitrageService);
  private projetsService = inject(ProjetsService);

  items = signal<AutorisationEngagement[]>([]);
  filteredItems = signal<AutorisationEngagement[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<AutorisationEngagement | null>(null);
  saving = signal(false);
  formData: Partial<AutorisationEngagement> = this.resetForm();

  statuts = [
    { value: 'PREVU', label: 'Prevu' },
    { value: 'AUTORISE', label: 'Autorise' },
    { value: 'ENGAGE', label: 'Engage' }
  ];

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: AutorisationEngagement | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
    this.loadProjets();
  }

  private resetForm(): Partial<AutorisationEngagement> {
    return {
      projetId: undefined,
      annee: new Date().getFullYear(),
      montantAE: 0,
      montantCP: undefined,
      natureDepense: '',
      lignebudgetaire: '',
      dateAutorisation: undefined,
      statut: 'PREVU',
      observations: ''
    };
  }

  load(): void {
    this.arbitrageService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des autorisations', 'error')
    });
  }

  loadProjets(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => this.projets.set(data)
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.natureDepense?.toLowerCase().includes(term) ||
      i.annee?.toString().includes(term) ||
      i.lignebudgetaire?.toLowerCase().includes(term) ||
      this.getProjetNom(i.projetId).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: AutorisationEngagement): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.projetId || !this.formData.annee || !this.formData.montantAE || !this.formData.statut) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const isEdit = !!this.editingItem();
    const obs = isEdit
      ? this.arbitrageService.update(this.editingItem()!.id, this.formData)
      : this.arbitrageService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(isEdit ? 'Autorisation modifiee avec succes' : 'Autorisation creee avec succes', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  confirmDelete(item: AutorisationEngagement): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'autorisation';
    this.confirmDialogMessage = 'Etes-vous sur de vouloir supprimer cette autorisation d\'engagement ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.arbitrageService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Autorisation supprimee avec succes', 'success');
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

  getProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const projet = this.projets().find(p => String(p.id) === String(id));
    return projet ? (projet.code + ' - ' + projet.titre) : '-';
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'PREVU': 'badge-secondary',
      'AUTORISE': 'badge-info',
      'ENGAGE': 'badge-success'
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
