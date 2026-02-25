import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnveloppesService } from '@core/services/enveloppes.service';
import { ProgrammationService } from '@core/services/programmation.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { EnveloppeReference, PipAnnuel, Ministere, Secteur } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-enveloppes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './enveloppes.component.html',
  styleUrl: './enveloppes.component.scss'
})
export class EnveloppesComponent implements OnInit {
  private enveloppesService = inject(EnveloppesService);
  private programmationService = inject(ProgrammationService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);

  items = signal<EnveloppeReference[]>([]);
  filteredItems = signal<EnveloppeReference[]>([]);
  pipsAnnuels = signal<PipAnnuel[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<EnveloppeReference | null>(null);
  saving = signal(false);
  formData: Partial<EnveloppeReference> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: EnveloppeReference | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
    this.loadPipsAnnuels();
    this.loadMinisteres();
    this.loadSecteurs();
  }

  private resetForm(): Partial<EnveloppeReference> {
    return { pipAnnuelId: undefined, ministereId: undefined, secteurId: undefined, montantEnveloppe: 0 };
  }

  load(): void {
    this.enveloppesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement', 'error')
    });
  }

  loadPipsAnnuels(): void {
    this.programmationService.getAll().subscribe({ next: (data) => this.pipsAnnuels.set(data) });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
  }

  loadSecteurs(): void {
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      this.getPipLabel(i.pipAnnuelId).toLowerCase().includes(term) ||
      this.getMinistereNom(i.ministereId).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: EnveloppeReference): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.pipAnnuelId || !this.formData.montantEnveloppe) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.enveloppesService.update(this.editingItem()!.id, this.formData)
      : this.enveloppesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Enveloppe modifiée avec succès' : 'Enveloppe créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: EnveloppeReference): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'enveloppe';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer cette enveloppe de référence ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.enveloppesService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Enveloppe supprimée avec succès', 'success'); },
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

  getPipLabel(id: number | undefined): string {
    if (!id) return '-';
    const pip = this.pipsAnnuels().find(p => p.id === id);
    return pip ? `PIP ${pip.annee}` : '-';
  }

  getMinistereNom(id: number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => m.id === id);
    return m ? (m.sigle || m.nom) : '-';
  }

  getSecteurNom(id: number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => s.id === id);
    return s ? s.nom : '-';
  }

  formatMontant(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }
}
