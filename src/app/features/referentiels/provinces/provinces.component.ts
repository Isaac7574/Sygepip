import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProvincesService } from '@core/services/provinces.service';
import { RegionsService } from '@core/services/regions.service';
import { Province, Region } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-provinces',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './provinces.component.html',
  styleUrl: './provinces.component.scss'
})
export class ProvincesComponent implements OnInit {
  private provincesService = inject(ProvincesService);
  private regionsService = inject(RegionsService);

  items = signal<Province[]>([]);
  regions = signal<Region[]>([]);
  filteredItems = signal<Province[]>([]);
  searchTerm = '';
  selectedRegionId = '';

  modalOpen = signal(false);
  editingItem = signal<Province | null>(null);
  saving = signal(false);
  formData: Partial<Province> = this.getEmptyForm();

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = 'Confirmer la suppression';
  confirmDialogMessage = '';
  private itemToDelete: Province | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  ngOnInit(): void {
    this.loadRegions();
    this.load();
  }

  private getEmptyForm(): Partial<Province> {
    return { code: '', nom: '', regionId: '', chefLieu: '', actif: true };
  }

  loadRegions(): void {
    this.regionsService.getAll().subscribe({
      next: (data) => this.regions.set(data),
      error: () => this.showToast('Erreur lors du chargement des régions', 'error')
    });
  }

  load(): void {
    this.provincesService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.applyFilters();
      },
      error: () => this.showToast('Erreur lors du chargement des provinces', 'error')
    });
  }

  applyFilters(): void {
    let result = this.items();

    // Filter by region
    if (this.selectedRegionId) {
      result = result.filter(p => p.regionId === this.selectedRegionId);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(i =>
        i.nom?.toLowerCase().includes(term) ||
        i.code?.toLowerCase().includes(term) ||
        i.chefLieu?.toLowerCase().includes(term)
      );
    }

    this.filteredItems.set(result);
  }

  search(): void {
    this.applyFilters();
  }

  onRegionFilterChange(): void {
    this.applyFilters();
  }

  getRegionNom(regionId: string | undefined): string {
    if (!regionId) return '-';
    const region = this.regions().find(r => r.id === regionId);
    return region?.nom || '-';
  }

  openModal(): void {
    this.formData = this.getEmptyForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Province): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.nom || !this.formData.regionId) {
      this.showToast('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }

    this.saving.set(true);
    const obs = this.editingItem()
      ? this.provincesService.update(this.editingItem()!.id, this.formData)
      : this.provincesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          this.editingItem() ? 'Province modifiée avec succès' : 'Province créée avec succès',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  confirmDelete(item: Province): void {
    this.itemToDelete = item;
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer la province "${item.nom}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.provincesService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Province supprimée avec succès', 'success');
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

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
