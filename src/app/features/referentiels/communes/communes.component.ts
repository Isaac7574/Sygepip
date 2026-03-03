import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunesService } from '@core/services/communes.service';
import { ProvincesService } from '@core/services/provinces.service';
import { RegionsService } from '@core/services/regions.service';
import { Commune, Province, Region, TypeCommune } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-communes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './communes.component.html',
  styleUrl: './communes.component.scss'
})
export class CommunesComponent implements OnInit {
  private communesService = inject(CommunesService);
  private provincesService = inject(ProvincesService);
  private regionsService = inject(RegionsService);

  items = signal<Commune[]>([]);
  regions = signal<Region[]>([]);
  provinces = signal<Province[]>([]);
  filteredProvinces = signal<Province[]>([]);
  filteredItems = signal<Commune[]>([]);

  searchTerm = '';
  selectedRegionId = '';
  selectedProvinceId = '';

  modalOpen = signal(false);
  editingItem = signal<Commune | null>(null);
  saving = signal(false);
  formData: Partial<Commune> = this.getEmptyForm();

  // Form cascading
  formRegionId = '';
  formProvinces = signal<Province[]>([]);

  typesCommune: { value: TypeCommune; label: string }[] = [
    { value: 'URBAINE', label: 'Urbaine' },
    { value: 'RURALE', label: 'Rurale' }
  ];

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = 'Confirmer la suppression';
  confirmDialogMessage = '';
  private itemToDelete: Commune | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  ngOnInit(): void {
    this.loadRegions();
    this.loadProvinces();
    this.load();
  }

  private getEmptyForm(): Partial<Commune> {
    return { code: '', nom: '', provinceId: '', typeCommune: 'RURALE', actif: true };
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

  load(): void {
    this.communesService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.applyFilters();
      },
      error: () => this.showToast('Erreur lors du chargement des communes', 'error')
    });
  }

  applyFilters(): void {
    let result = this.items();

    // Filter by region
    if (this.selectedRegionId) {
      const provincesInRegion = this.provinces().filter(p => p.regionId === this.selectedRegionId).map(p => p.id);
      result = result.filter(c => provincesInRegion.includes(c.provinceId));
      this.filteredProvinces.set(this.provinces().filter(p => p.regionId === this.selectedRegionId));
    } else {
      this.filteredProvinces.set(this.provinces());
    }

    // Filter by province
    if (this.selectedProvinceId) {
      result = result.filter(c => c.provinceId === this.selectedProvinceId);
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
    this.applyFilters();
  }

  onProvinceFilterChange(): void {
    this.applyFilters();
  }

  onFormRegionChange(): void {
    this.formData.provinceId = '';
    if (this.formRegionId) {
      this.provincesService.getByRegion(this.formRegionId).subscribe({
        next: (data) => this.formProvinces.set(data),
        error: () => this.formProvinces.set([])
      });
    } else {
      this.formProvinces.set([]);
    }
  }

  getProvinceNom(provinceId: string | undefined): string {
    if (!provinceId) return '-';
    const province = this.provinces().find(p => p.id === provinceId);
    return province?.nom || '-';
  }

  getRegionNom(regionId: string | undefined): string {
    if (!regionId) return '-';
    const region = this.regions().find(r => r.id === regionId);
    return region?.nom || '-';
  }

  getTypeCommuneLabel(type: TypeCommune | undefined): string {
    if (!type) return '-';
    const found = this.typesCommune.find(t => t.value === type);
    return found?.label || type;
  }

  getTypeBadgeClass(type: TypeCommune | undefined): string {
    switch (type) {
      case 'URBAINE': return 'badge-primary';
      case 'RURALE': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  openModal(): void {
    this.formData = this.getEmptyForm();
    this.formRegionId = '';
    this.formProvinces.set([]);
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Commune): void {
    this.formData = { ...item };
    // Find regionId from province
    const province = this.provinces().find(p => p.id === item.provinceId);
    this.formRegionId = province?.regionId || '';
    if (this.formRegionId) {
      this.provincesService.getByRegion(this.formRegionId).subscribe({
        next: (data) => this.formProvinces.set(data)
      });
    }
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.nom || !this.formData.provinceId) {
      this.showToast('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }

    this.saving.set(true);
    const obs = this.editingItem()
      ? this.communesService.update(this.editingItem()!.id, this.formData)
      : this.communesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          this.editingItem() ? 'Commune modifiée avec succès' : 'Commune créée avec succès',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  confirmDelete(item: Commune): void {
    this.itemToDelete = item;
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer la commune "${item.nom}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.communesService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Commune supprimée avec succès', 'success');
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
