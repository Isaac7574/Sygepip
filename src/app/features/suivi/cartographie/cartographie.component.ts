import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartographieService } from '@core/services/cartographie.service';
import { RegionsService } from '@core/services/regions.service';
import { ProjetsService } from '@core/services/projets.service';
import { ProvincesService } from '@core/services/provinces.service';
import { CommunesService } from '@core/services/communes.service';
import { VillagesService } from '@core/services/villages.service';
import { LocaliteIntervention, Region, Projet, Province, Commune, Village, TypeLocalite } from '@core/models';
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
  private provincesService = inject(ProvincesService);
  private communesService = inject(CommunesService);
  private villagesService = inject(VillagesService);

  items = signal<LocaliteIntervention[]>([]);
  filteredItems = signal<LocaliteIntervention[]>([]);
  regions = signal<Region[]>([]);
  projets = signal<Projet[]>([]);
  provinces = signal<Province[]>([]);
  communes = signal<Commune[]>([]);
  villages = signal<Village[]>([]);
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
  typeLocaliteOptions: { value: TypeLocalite; label: string }[] = [
    { value: 'REGION', label: 'Région' },
    { value: 'PROVINCE', label: 'Province' },
    { value: 'COMMUNE', label: 'Commune' },
    { value: 'VILLAGE', label: 'Village / Secteur' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadRegions();
    this.loadProjets();
  }

  private resetForm(): Partial<LocaliteIntervention> {
    return {
      projetId: undefined,
      typeLocalite: 'REGION',
      regionId: undefined,
      provinceId: undefined,
      communeId: undefined,
      villageId: undefined,
      description: '',
      latitude: undefined,
      longitude: undefined,
      actif: true
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
      (i.nomComplet || '').toLowerCase().includes(term) ||
      (i.regionNom || '').toLowerCase().includes(term) ||
      (i.provinceNom || '').toLowerCase().includes(term) ||
      (i.communeNom || '').toLowerCase().includes(term) ||
      (i.villageNom || '').toLowerCase().includes(term) ||
      (i.description || '').toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.provinces.set([]);
    this.communes.set([]);
    this.villages.set([]);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: LocaliteIntervention): void {
    this.formData = { ...item, typeLocalite: item.typeLocalite || 'REGION' };
    this.editingItem.set(item);
    this.ensureCascadeData();
    this.modalOpen.set(true);
  }

  save(): void {
    const missing: string[] = [];
    if (!this.formData.projetId) missing.push('Projet');
    if (!this.formData.typeLocalite) missing.push('Type de localité');
    if (!this.formData.regionId) missing.push('Région');
    if (this.requiresProvince() && !this.formData.provinceId) missing.push('Province');
    if (this.requiresCommune() && !this.formData.communeId) missing.push('Commune');
    if (this.requiresVillage() && !this.formData.villageId) missing.push('Village');
    if (missing.length > 0) {
      this.showToast(`Veuillez remplir les champs obligatoires : ${missing.join(', ')}`, 'error');
      return;
    }
    this.saving.set(true);
    const payload: Partial<LocaliteIntervention> = {
      projetId: this.formData.projetId,
      typeLocalite: this.formData.typeLocalite,
      regionId: this.formData.regionId,
      provinceId: this.requiresProvince() ? this.formData.provinceId : undefined,
      communeId: this.requiresCommune() ? this.formData.communeId : undefined,
      villageId: this.requiresVillage() ? this.formData.villageId : undefined,
      description: this.formData.description?.trim() || undefined,
      latitude: this.formData.latitude,
      longitude: this.formData.longitude,
      actif: this.formData.actif ?? true
    };
    const obs = this.editingItem()
      ? this.cartographieService.update(this.editingItem()!.id, payload)
      : this.cartographieService.create(payload);

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
    const nom = item.nomComplet || item.villageNom || item.communeNom || item.provinceNom || item.regionNom || '';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer la localité "${nom}" ?`;
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

  getTypeLabel(type: TypeLocalite | undefined): string {
    const found = this.typeLocaliteOptions.find(o => o.value === type);
    return found?.label || '-';
  }

  requiresProvince(): boolean {
    return this.typeRank(this.formData.typeLocalite) >= 2;
  }

  requiresCommune(): boolean {
    return this.typeRank(this.formData.typeLocalite) >= 3;
  }

  requiresVillage(): boolean {
    return this.typeRank(this.formData.typeLocalite) >= 4;
  }

  onTypeLocaliteChange(): void {
    this.formData.provinceId = undefined;
    this.formData.communeId = undefined;
    this.formData.villageId = undefined;
    this.communes.set([]);
    this.villages.set([]);
    if (this.requiresProvince() && this.formData.regionId) {
      this.loadProvinces(this.formData.regionId);
    } else {
      this.provinces.set([]);
    }
  }

  onRegionChange(): void {
    this.formData.provinceId = undefined;
    this.formData.communeId = undefined;
    this.formData.villageId = undefined;
    this.communes.set([]);
    this.villages.set([]);
    if (this.requiresProvince() && this.formData.regionId) {
      this.loadProvinces(this.formData.regionId);
    } else {
      this.provinces.set([]);
    }
  }

  onProvinceChange(): void {
    this.formData.communeId = undefined;
    this.formData.villageId = undefined;
    this.villages.set([]);
    if (this.requiresCommune() && this.formData.provinceId) {
      this.loadCommunes(this.formData.provinceId);
    } else {
      this.communes.set([]);
    }
  }

  onCommuneChange(): void {
    this.formData.villageId = undefined;
    if (this.requiresVillage() && this.formData.communeId) {
      this.loadVillages(this.formData.communeId);
    } else {
      this.villages.set([]);
    }
  }

  private ensureCascadeData(): void {
    if (this.requiresProvince() && this.formData.regionId) {
      this.loadProvinces(this.formData.regionId);
    } else {
      this.provinces.set([]);
    }
    if (this.requiresCommune() && this.formData.provinceId) {
      this.loadCommunes(this.formData.provinceId);
    } else {
      this.communes.set([]);
    }
    if (this.requiresVillage() && this.formData.communeId) {
      this.loadVillages(this.formData.communeId);
    } else {
      this.villages.set([]);
    }
  }

  private loadProvinces(regionId: string): void {
    this.provincesService.getByRegion(regionId).subscribe({
      next: (data) => this.provinces.set(data),
      error: () => this.showToast('Erreur lors du chargement des provinces', 'error')
    });
  }

  private loadCommunes(provinceId: string): void {
    this.communesService.getByProvince(provinceId).subscribe({
      next: (data) => this.communes.set(data),
      error: () => this.showToast('Erreur lors du chargement des communes', 'error')
    });
  }

  private loadVillages(communeId: string): void {
    this.villagesService.getByCommune(communeId).subscribe({
      next: (data) => this.villages.set(data),
      error: () => this.showToast('Erreur lors du chargement des villages', 'error')
    });
  }

  private typeRank(type: TypeLocalite | undefined): number {
    switch (type) {
      case 'PROVINCE':
        return 2;
      case 'COMMUNE':
        return 3;
      case 'VILLAGE':
        return 4;
      default:
        return 1;
    }
  }
}
