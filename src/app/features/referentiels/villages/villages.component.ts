import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VillagesService } from '@core/services/villages.service';
import { CommunesService } from '@core/services/communes.service';
import { ProvincesService } from '@core/services/provinces.service';
import { RegionsService } from '@core/services/regions.service';
import { Village, Commune, Province, Region } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-villages',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './villages.component.html',
  styleUrl: './villages.component.scss'
})
export class VillagesComponent implements OnInit {
  private villagesService = inject(VillagesService);
  private communesService = inject(CommunesService);
  private provincesService = inject(ProvincesService);
  private regionsService = inject(RegionsService);

  items = signal<Village[]>([]);
  regions = signal<Region[]>([]);
  provinces = signal<Province[]>([]);
  communes = signal<Commune[]>([]);
  filteredProvinces = signal<Province[]>([]);
  filteredCommunes = signal<Commune[]>([]);
  filteredItems = signal<Village[]>([]);

  searchTerm = '';
  selectedRegionId = '';
  selectedProvinceId = '';
  selectedCommuneId = '';

  modalOpen = signal(false);
  editingItem = signal<Village | null>(null);
  saving = signal(false);
  formData: Partial<Village> = this.getEmptyForm();

  // Form cascading
  formRegionId = '';
  formProvinceId = '';
  formProvinces = signal<Province[]>([]);
  formCommunes = signal<Commune[]>([]);

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = 'Confirmer la suppression';
  confirmDialogMessage = '';
  private itemToDelete: Village | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  ngOnInit(): void {
    this.loadRegions();
    this.loadProvinces();
    this.loadCommunes();
    this.load();
  }

  private getEmptyForm(): Partial<Village> {
    return { code: '', nom: '', communeId: '', latitude: undefined, longitude: undefined, actif: true };
  }

  loadRegions(): void {
    this.regionsService.getAll().subscribe({
      next: (data) => this.regions.set(data),
      error: () => this.showToast('Erreur lors du chargement des régions', 'error')
    });
  }

  loadProvinces(): void {
    this.provincesService.getAll().subscribe({
      next: (data) => this.provinces.set(data),
      error: () => this.showToast('Erreur lors du chargement des provinces', 'error')
    });
  }

  loadCommunes(): void {
    this.communesService.getAll().subscribe({
      next: (data) => this.communes.set(data),
      error: () => this.showToast('Erreur lors du chargement des communes', 'error')
    });
  }

  load(): void {
    this.villagesService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.applyFilters();
      },
      error: () => this.showToast('Erreur lors du chargement des villages', 'error')
    });
  }

  applyFilters(): void {
    let result = this.items();

    // Filter by region -> get provinces
    if (this.selectedRegionId) {
      this.filteredProvinces.set(this.provinces().filter(p => p.regionId === this.selectedRegionId));
    } else {
      this.filteredProvinces.set(this.provinces());
    }

    // Filter by province -> get communes
    if (this.selectedProvinceId) {
      this.filteredCommunes.set(this.communes().filter(c => c.provinceId === this.selectedProvinceId));
      const communeIds = this.filteredCommunes().map(c => c.id);
      result = result.filter(v => communeIds.includes(v.communeId));
    } else if (this.selectedRegionId) {
      const provinceIds = this.filteredProvinces().map(p => p.id);
      const communeIds = this.communes().filter(c => provinceIds.includes(c.provinceId)).map(c => c.id);
      this.filteredCommunes.set(this.communes().filter(c => provinceIds.includes(c.provinceId)));
      result = result.filter(v => communeIds.includes(v.communeId));
    } else {
      this.filteredCommunes.set(this.communes());
    }

    // Filter by commune
    if (this.selectedCommuneId) {
      result = result.filter(v => v.communeId === this.selectedCommuneId);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(i =>
        i.nom?.toLowerCase().includes(term) ||
        i.code?.toLowerCase().includes(term)
      );
    }

    this.filteredItems.set(result);
  }

  search(): void {
    this.applyFilters();
  }

  onRegionFilterChange(): void {
    this.selectedProvinceId = '';
    this.selectedCommuneId = '';
    this.applyFilters();
  }

  onProvinceFilterChange(): void {
    this.selectedCommuneId = '';
    this.applyFilters();
  }

  onCommuneFilterChange(): void {
    this.applyFilters();
  }

  // Form cascading
  onFormRegionChange(): void {
    this.formProvinceId = '';
    this.formData.communeId = '';
    this.formCommunes.set([]);
    if (this.formRegionId) {
      this.provincesService.getByRegion(this.formRegionId).subscribe({
        next: (data) => this.formProvinces.set(data),
        error: () => this.formProvinces.set([])
      });
    } else {
      this.formProvinces.set([]);
    }
  }

  onFormProvinceChange(): void {
    this.formData.communeId = '';
    if (this.formProvinceId) {
      this.communesService.getByProvince(this.formProvinceId).subscribe({
        next: (data) => this.formCommunes.set(data),
        error: () => this.formCommunes.set([])
      });
    } else {
      this.formCommunes.set([]);
    }
  }

  getCommuneNom(communeId: string | undefined): string {
    if (!communeId) return '-';
    const commune = this.communes().find(c => c.id === communeId);
    return commune?.nom || '-';
  }

  openModal(): void {
    this.formData = this.getEmptyForm();
    this.formRegionId = '';
    this.formProvinceId = '';
    this.formProvinces.set([]);
    this.formCommunes.set([]);
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Village): void {
    this.formData = { ...item };
    // Find provinceId and regionId from commune
    const commune = this.communes().find(c => c.id === item.communeId);
    if (commune) {
      const province = this.provinces().find(p => p.id === commune.provinceId);
      this.formProvinceId = commune.provinceId;
      this.formRegionId = province?.regionId || '';

      if (this.formRegionId) {
        this.provincesService.getByRegion(this.formRegionId).subscribe({
          next: (data) => this.formProvinces.set(data)
        });
      }
      if (this.formProvinceId) {
        this.communesService.getByProvince(this.formProvinceId).subscribe({
          next: (data) => this.formCommunes.set(data)
        });
      }
    }
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.nom || !this.formData.communeId) {
      this.showToast('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }

    this.saving.set(true);
    const obs = this.editingItem()
      ? this.villagesService.update(this.editingItem()!.id, this.formData)
      : this.villagesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          this.editingItem() ? 'Village modifié avec succès' : 'Village créé avec succès',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  confirmDelete(item: Village): void {
    this.itemToDelete = item;
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer le village "${item.nom}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.villagesService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Village supprimé avec succès', 'success');
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

  formatCoord(value: number | undefined): string {
    return value !== undefined ? value.toFixed(6) : '-';
  }
}
