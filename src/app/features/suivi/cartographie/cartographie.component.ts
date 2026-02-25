import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartographieService } from '@core/services/cartographie.service';
import { RegionsService } from '@core/services/regions.service';
import { ProjetsService } from '@core/services/projets.service';
import { LocaliteIntervention, Region, Projet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-cartographie',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './cartographie.component.html',
  styleUrl: './cartographie.component.scss'
})
export class CartographieComponent implements OnInit {
  private cartographieService = inject(CartographieService);
  private regionsService = inject(RegionsService);
  private projetsService = inject(ProjetsService);

  items = signal<LocaliteIntervention[]>([]);
  filteredItems = signal<LocaliteIntervention[]>([]);
  regions = signal<Region[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<LocaliteIntervention | null>(null);
  saving = signal(false);
  formData: Partial<LocaliteIntervention> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: LocaliteIntervention | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
    this.loadRegions();
    this.loadProjets();
  }

  private resetForm(): Partial<LocaliteIntervention> {
    return {
      projetId: undefined,
      regionId: undefined,
      province: '',
      commune: '',
      village: '',
      latitude: undefined,
      longitude: undefined
    };
  }

  load(): void {
    this.cartographieService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des localités', 'error')
    });
  }

  private loadRegions(): void {
    this.regionsService.getAll().subscribe({
      next: (data) => this.regions.set(data),
      error: () => this.showToast('Erreur lors du chargement des régions', 'error')
    });
  }

  private loadProjets(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => this.projets.set(data),
      error: () => this.showToast('Erreur lors du chargement des projets', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.province?.toLowerCase().includes(term) ||
      i.commune?.toLowerCase().includes(term) ||
      i.village?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: LocaliteIntervention): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.regionId || !this.formData.projetId || !this.formData.village) {
      this.showToast('Veuillez remplir tous les champs obligatoires (Projet, Région, Village)', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.cartographieService.update(this.editingItem()!.id, this.formData)
      : this.cartographieService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Localité modifiée avec succès' : 'Localité créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: LocaliteIntervention): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer la localité';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer le village "${item.village || ''}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.cartographieService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Localité supprimée avec succès', 'success'); },
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

  getRegionNom(id: string | number | undefined): string {
    if (!id) return '-';
    return this.regions().find(r => String(r.id) === String(id))?.nom || '-';
  }

  getProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    return this.projets().find(p => String(p.id) === String(id))?.titre || '-';
  }

  formatCoord(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toFixed(6);
  }
}
