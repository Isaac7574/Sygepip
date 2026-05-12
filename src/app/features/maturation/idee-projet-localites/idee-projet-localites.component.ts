import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Commune,
  IdeeProjet,
  IdeeProjetLocaliteIntervention,
  IdeeProjetLocaliteInterventionPayload,
  IdeeProjetTypeLocaliteIntervention,
  Province,
  Region
} from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { CommunesService } from '@core/services/communes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { LocalitesInterventionService } from '@core/services/localites-intervention.service';
import { ProvincesService } from '@core/services/provinces.service';
import { RegionsService } from '@core/services/regions.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { catchError, forkJoin, map, of, throwError } from 'rxjs';

interface EditableLocaliteRow {
  typeLocalite: IdeeProjetTypeLocaliteIntervention;
  regionId?: string;
  provinceId?: string;
  communeId?: string;
  provinces: Province[];
  communes: Commune[];
}

@Component({
  selector: 'app-idee-projet-localites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './idee-projet-localites.component.html',
  styleUrl: './idee-projet-localites.component.scss'
})
export class IdeeProjetLocalitesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private ideesProjetService = inject(IdeesProjetService);
  private localitesInterventionService = inject(LocalitesInterventionService);
  private regionsService = inject(RegionsService);
  private provincesService = inject(ProvincesService);
  private communesService = inject(CommunesService);

  idee = signal<IdeeProjet | null>(null);
  regions = signal<Region[]>([]);
  rows = signal<EditableLocaliteRow[]>([]);
  couvreToutTerritoire = signal(false);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private manualRowsSnapshot: EditableLocaliteRow[] | null = null;

  readonly typeLocaliteOptions: { value: IdeeProjetTypeLocaliteIntervention; label: string }[] = [
    { value: 'REGION', label: 'Région' },
    { value: 'PROVINCE', label: 'Province' },
    { value: 'COMMUNE', label: 'Commune' }
  ];

  ngOnInit(): void {
    const ideeProjetId = this.route.snapshot.paramMap.get('ididee') ?? this.route.snapshot.paramMap.get('id');
    if (!ideeProjetId) {
      this.error.set("Identifiant de l'idée de projet manquant.");
      this.loading.set(false);
      return;
    }

    this.loadData(ideeProjetId);
  }

  getIdeesListRoute(): string {
    return this.authService.hasRole('AGENT')
      ? '/app/maturation/mes-idees'
      : '/app/maturation/idees-projet';
  }

  canEditLocalites(): boolean {
    const idee = this.idee();
    if (!idee) {
      return false;
    }

    if (this.authService.hasRole(['INSTRUCTEUR', 'INSTRUCTEUR_DGESS', 'DGESS', 'CNDP', 'DGEP'])) {
      return false;
    }

    return idee.statut === 'IDEE_CONCEPTION_BROUILLON';
  }

  addRow(): void {
    if (this.couvreToutTerritoire()) {
      return;
    }

    this.rows.update(rows => [...rows, this.createEmptyRow()]);
  }

  removeRow(index: number): void {
    if (this.couvreToutTerritoire()) {
      return;
    }

    this.rows.update(rows => {
      const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length > 0 ? nextRows : [this.createEmptyRow()];
    });
  }

  onCouvreToutTerritoireChange(checked: boolean): void {
    this.couvreToutTerritoire.set(checked);

    if (checked) {
      this.manualRowsSnapshot = this.cloneRows(this.rows());
      this.rows.set(this.buildAllTerritoryRows());
      return;
    }

    if (this.manualRowsSnapshot && this.manualRowsSnapshot.length > 0) {
      this.rows.set(this.cloneRows(this.manualRowsSnapshot));
      this.manualRowsSnapshot = null;
      return;
    }

    this.rows.set([this.createEmptyRow()]);
  }

  onTypeLocaliteChange(index: number): void {
    this.rows.update(rows => rows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      return {
        ...row,
        provinceId: undefined,
        communeId: undefined,
        provinces: [],
        communes: []
      };
    }));

    const row = this.rows()[index];
    if (this.requiresProvince(row) && row.regionId) {
      this.loadProvincesForRow(index, row.regionId);
    }
  }

  onRegionChange(index: number): void {
    this.rows.update(rows => rows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      return {
        ...row,
        provinceId: undefined,
        communeId: undefined,
        provinces: [],
        communes: []
      };
    }));

    const row = this.rows()[index];
    if (this.requiresProvince(row) && row.regionId) {
      this.loadProvincesForRow(index, row.regionId);
    }
  }

  onProvinceChange(index: number): void {
    this.rows.update(rows => rows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      return {
        ...row,
        communeId: undefined,
        communes: []
      };
    }));

    const row = this.rows()[index];
    if (this.requiresCommune(row) && row.provinceId) {
      this.loadCommunesForRow(index, row.provinceId);
    }
  }

  save(): void {
    const idee = this.idee();
    if (!idee) {
      return;
    }

    if (!this.canEditLocalites()) {
      this.showToast("Les localités d'intervention ne sont plus modifiables à ce statut.", 'error');
      return;
    }

    const effectiveRows = this.getEffectiveRowsForSave();
    const validationError = this.validateRows(effectiveRows);
    if (validationError) {
      this.showToast(validationError, 'error');
      return;
    }

    const payload: IdeeProjetLocaliteInterventionPayload[] = effectiveRows.map((row, index) => ({
      ideeProjetId: String(idee.id),
      typeLocalite: row.typeLocalite,
      regionId: row.regionId,
      provinceId: this.requiresProvince(row) ? row.provinceId : undefined,
      communeId: this.requiresCommune(row) ? row.communeId : undefined,
      ordreAffichage: index
    }));

    this.saving.set(true);
    this.localitesInterventionService.replaceForIdeeProjet(idee.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('Localités d’intervention enregistrées avec succès', 'success');
        window.setTimeout(() => {
          this.router.navigate(['/app/maturation/idees-projet', idee.id]);
        }, 600);
      },
      error: () => {
        this.saving.set(false);
        this.showToast("Erreur lors de l'enregistrement des localités d’intervention", 'error');
      }
    });
  }

  getRegionName(regionId?: string): string {
    if (!regionId) {
      return '-';
    }

    return this.regions().find(region => region.id === regionId)?.nom || '-';
  }

  private loadData(ideeProjetId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      idee: this.ideesProjetService.getById(ideeProjetId),
      regions: this.regionsService.getAll().pipe(
        map(items => items.filter(item => item.actif !== false))
      ),
      localites: this.localitesInterventionService.getByIdeeProjet(ideeProjetId).pipe(
        catchError((err: any) => err?.status === 404 ? of([]) : throwError(() => err))
      )
    }).subscribe({
      next: ({ idee, regions, localites }) => {
        this.idee.set(idee);
        this.regions.set(regions);
        const rows = this.buildRows(localites);
        this.couvreToutTerritoire.set(this.isAllTerritoryRows(rows, regions));
        this.rows.set(rows);
        this.hydrateCascadeData();
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors du chargement des localités d’intervention.");
        this.loading.set(false);
      }
    });
  }

  private buildRows(localites: IdeeProjetLocaliteIntervention[]): EditableLocaliteRow[] {
    if (!Array.isArray(localites) || localites.length === 0) {
      return [this.createEmptyRow()];
    }

    return [...localites]
      .sort((left, right) => (left.ordreAffichage ?? 0) - (right.ordreAffichage ?? 0))
      .map(localite => ({
        typeLocalite: localite.typeLocalite,
        regionId: localite.regionId,
        provinceId: localite.provinceId,
        communeId: localite.communeId,
        provinces: [],
        communes: []
      }));
  }

  private hydrateCascadeData(): void {
    this.rows().forEach((row, index) => {
      if (this.requiresProvince(row) && row.regionId) {
        this.loadProvincesForRow(index, row.regionId, row.provinceId);
      }

      if (this.requiresCommune(row) && row.provinceId) {
        this.loadCommunesForRow(index, row.provinceId, row.communeId);
      }
    });
  }

  private loadProvincesForRow(index: number, regionId: string, selectedProvinceId?: string): void {
    this.provincesService.getByRegion(regionId).subscribe({
      next: (provinces) => {
        this.rows.update(rows => rows.map((row, rowIndex) => {
          if (rowIndex !== index) {
            return row;
          }

          const provinceStillExists = selectedProvinceId
            ? provinces.some(province => province.id === selectedProvinceId)
            : !!row.provinceId && provinces.some(province => province.id === row.provinceId);

          return {
            ...row,
            provinces,
            provinceId: provinceStillExists ? (selectedProvinceId ?? row.provinceId) : undefined,
            communeId: provinceStillExists ? row.communeId : undefined
          };
        }));
      },
      error: () => this.showToast('Erreur lors du chargement des provinces', 'error')
    });
  }

  private loadCommunesForRow(index: number, provinceId: string, selectedCommuneId?: string): void {
    this.communesService.getByProvince(provinceId).subscribe({
      next: (communes) => {
        this.rows.update(rows => rows.map((row, rowIndex) => {
          if (rowIndex !== index) {
            return row;
          }

          const communeStillExists = selectedCommuneId
            ? communes.some(commune => commune.id === selectedCommuneId)
            : !!row.communeId && communes.some(commune => commune.id === row.communeId);

          return {
            ...row,
            communes,
            communeId: communeStillExists ? (selectedCommuneId ?? row.communeId) : undefined
          };
        }));
      },
      error: () => this.showToast('Erreur lors du chargement des communes', 'error')
    });
  }

  private validateRows(rows: EditableLocaliteRow[]): string | null {
    if (this.couvreToutTerritoire() && this.regions().length === 0) {
      return 'Aucune region active disponible pour couvrir tout le territoire.';
    }

    if (rows.length === 0) {
      return 'Ajoutez au moins une localité d’intervention.';
    }

    const duplicates = new Set<string>();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 1;

      if (this.isEmptyRow(row)) {
        return `La ligne ${rowNumber} est vide.`;
      }

      if (!row.regionId) {
        return `La région est obligatoire à la ligne ${rowNumber}.`;
      }

      if (this.requiresProvince(row) && !row.provinceId) {
        return `La province est obligatoire à la ligne ${rowNumber}.`;
      }

      if (row.typeLocalite === 'COMMUNE' && !row.provinceId) {
        return `Une commune nécessite une province à la ligne ${rowNumber}.`;
      }

      if (this.requiresCommune(row) && !row.communeId) {
        return `La commune est obligatoire à la ligne ${rowNumber}.`;
      }

      const duplicateKey = [
        row.typeLocalite,
        row.regionId ?? '',
        row.provinceId ?? '',
        row.communeId ?? ''
      ].join('|');

      if (duplicates.has(duplicateKey)) {
        return `La ligne ${rowNumber} duplique une localité déjà saisie.`;
      }

      duplicates.add(duplicateKey);
    }

    return null;
  }

  private requiresProvince(row: EditableLocaliteRow): boolean {
    return row.typeLocalite === 'PROVINCE' || row.typeLocalite === 'COMMUNE';
  }

  private requiresCommune(row: EditableLocaliteRow): boolean {
    return row.typeLocalite === 'COMMUNE';
  }

  private isEmptyRow(row: EditableLocaliteRow): boolean {
    return !row.regionId && !row.provinceId && !row.communeId;
  }

  private createEmptyRow(): EditableLocaliteRow {
    return {
      typeLocalite: 'REGION',
      regionId: undefined,
      provinceId: undefined,
      communeId: undefined,
      provinces: [],
      communes: []
    };
  }

  private getEffectiveRowsForSave(): EditableLocaliteRow[] {
    return this.couvreToutTerritoire()
      ? this.buildAllTerritoryRows()
      : this.rows();
  }

  private buildAllTerritoryRows(): EditableLocaliteRow[] {
    return this.regions().map(region => ({
      typeLocalite: 'REGION' as const,
      regionId: region.id,
      provinceId: undefined,
      communeId: undefined,
      provinces: [],
      communes: []
    }));
  }

  private isAllTerritoryRows(rows: EditableLocaliteRow[], regions: Region[]): boolean {
    if (rows.length === 0 || regions.length === 0 || rows.length !== regions.length) {
      return false;
    }

    const activeRegionIds = new Set(regions.map(region => region.id));

    return rows.every(row =>
      row.typeLocalite === 'REGION'
      && !!row.regionId
      && activeRegionIds.has(row.regionId)
    );
  }

  private cloneRows(rows: EditableLocaliteRow[]): EditableLocaliteRow[] {
    return rows.map(row => ({
      ...row,
      provinces: [...row.provinces],
      communes: [...row.communes]
    }));
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
