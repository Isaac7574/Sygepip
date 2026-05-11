import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { CartographieService } from '@core/services/cartographie.service';
import { CiblesService } from '@core/services/cibles.service';
import { DashboardService } from '@core/services/dashboard.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { LocalitesInterventionService } from '@core/services/localites-intervention.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { ProjetsService } from '@core/services/projets.service';
import { RegionsService } from '@core/services/regions.service';
import {
  Cible,
  DashboardStats,
  DashboardGeoJsonFeature,
  DashboardMapProperties,
  GeoJsonFeatureCollection,
  IdeeProjet,
  IdeeProjetLocaliteIntervention,
  LocaliteIntervention,
  MapEntity,
  Ministere,
  Projet,
  ProvinceMapProperties,
  Region,
  RegionMapProperties,
  CommuneMapProperties,
  TypeLocalite,
  toMapEntity
} from '@core/models';

type ChartItem = {
  label: string;
  value: number;
  formattedValue: string;
  percent: number;
};

type DashboardTab = 'general' | 'localites';

type DashboardMapLevel = 'REGION' | 'PROVINCE' | 'COMMUNE';

type DashboardMapMetric =
  | 'NOMBRE_IDEES'
  | 'COUT_IDEES'
  | 'NOMBRE_PROJETS'
  | 'COUT_PROJETS';

type DashboardMapLegendItem = {
  id: string;
  label: string;
  color: string;
};

type RegionalStatisticMetric =
  | 'IDEES_PAR_REGION'
  | 'PROJETS_PAR_REGION'
  | 'PROJETS_PAR_CIBLE_REGION'
  | 'MONTANTS_PROJETS_PAR_CIBLE_REGION';

type IdeeRegionLocalite = IdeeProjetLocaliteIntervention & {
  ideeProjetId: string;
};

type LocaliteSummaryItem = {
  key: string;
  label: string;
  typeLocalite: TypeLocalite;
  regionNom: string;
  provinceNom: string;
  communeNom: string;
  occurrenceCount: number;
  projectCount: number;
  activeCount: number;
};

type LocaliteRegionMapStat = {
  region: Region;
  mapEntity: MapEntity<Region>;
  value: number;
  ideaCount: number;
  projectCount: number;
  amountTotal: number;
  localiteCount: number;
  activeCount: number;
};

const REGION_PALETTE = [
  '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78',
  '#2ca02c', '#98df8a', '#d62728', '#ff9896',
  '#9467bd', '#c5b0d5', '#8c564b', '#c49c94',
  '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7',
  '#bcbd22'
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly exportHeaderColor = '059669';

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private ciblesService = inject(CiblesService);
  private dashboardService = inject(DashboardService);
  private ideesProjetService = inject(IdeesProjetService);
  private localitesInterventionService = inject(LocalitesInterventionService);
  private ministeresService = inject(MinisteresService);
  private projetsService = inject(ProjetsService);
  private cartographieService = inject(CartographieService);
  private regionsService = inject(RegionsService);

  @ViewChild('localiteMapHost') localiteMapHost?: ElementRef<HTMLDivElement>;

  private leafletLib: any | null = null;
  private localiteMap: any | null = null;
  private localiteMapHostElement: HTMLDivElement | null = null;
  private localiteGeoJsonLayer: any | null = null;
  private localiteMarkerLayer: any | null = null;
  private localiteLegendControl: any | null = null;

  stats = signal<DashboardStats>(this.emptyStats());
  projets = signal<any[]>([]);
  projetsCatalogue = signal<Projet[]>([]);
  ideesCatalogue = signal<IdeeProjet[]>([]);
  ideeLocalites = signal<IdeeRegionLocalite[]>([]);
  cibles = signal<Cible[]>([]);
  ministeres = signal<Ministere[]>([]);
  regions = signal<Region[]>([]);
  localites = signal<LocaliteIntervention[]>([]);
  activeTab = signal<DashboardTab>('localites');
  selectedRegionalMetric = signal<'IDEES_PAR_REGION' | 'PROJETS_PAR_REGION' | 'PROJETS_PAR_CIBLE_REGION' | 'MONTANTS_PROJETS_PAR_CIBLE_REGION'>('PROJETS_PAR_REGION');
  selectedCibleId = signal<string>('ALL');
  selectedMapLevel = signal<DashboardMapLevel>('REGION');
  selectedMapMetric = signal<DashboardMapMetric>('NOMBRE_PROJETS');
  selectedMapFeature = signal<DashboardGeoJsonFeature | null>(null);
  selectedMapRegionId = signal<string | null>(null);
  selectedMapProvinceId = signal<string | null>(null);
  selectedMapRegionName = signal<string | null>(null);
  selectedMapProvinceName = signal<string | null>(null);
  mapFeatureCollection = signal<GeoJsonFeatureCollection | null>(null);
  loadingStats = signal(false);
  loadingLocalites = signal(false);
  exporting = signal(false);

  projetsParPipChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParPipAnnuel.map(item => ({
        label: String(item.annee),
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  montantParPipChart = computed(() =>
    this.toChartItems(
      this.stats().montantParPipAnnuel.map(item => ({
        label: String(item.annee),
        value: item.montantTotal,
        formattedValue: this.formatCurrency(item.montantTotal)
      }))
    )
  );

  typeProjetChart = computed(() =>
    this.toChartItems(
      this.stats().repartitionTypeProjetPip.map(item => ({
        label: item.typeProjetPip,
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  projetsParSecteurChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParSecteur.map(item => ({
        label: item.secteurNom,
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  montantParSecteurChart = computed(() =>
    this.toChartItems(
      this.stats().montantParSecteur.map(item => ({
        label: item.secteurNom,
        value: item.montantTotal,
        formattedValue: this.formatCurrency(item.montantTotal)
      }))
    )
  );

  ideesParCibleChart = computed(() =>
    this.toChartItems(
      this.stats().ideesParCible.map(item => ({
        label: item.cibleLibelle,
        value: item.nombre,
        formattedValue: item.nombre.toLocaleString('fr-FR')
      }))
    )
  );

  projetsParCibleChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParCible.map(item => ({
        label: item.cibleLibelle,
        value: item.nombre,
        formattedValue: item.nombre.toLocaleString('fr-FR')
      }))
    )
  );

  localitesParTypeChart = computed(() =>
    this.toChartItems(
      this.groupLocalitesByType().map(item => ({
        label: this.getTypeLocaliteLabel(item.typeLocalite),
        value: item.occurrenceCount,
        formattedValue: item.occurrenceCount.toLocaleString('fr-FR')
      }))
    )
  );

  localitesParRegionChart = computed(() =>
    this.toChartItems(
      this.groupLocalitesByRegion().slice(0, 8).map(item => ({
        label: item.label,
        value: item.occurrenceCount,
        formattedValue: item.occurrenceCount.toLocaleString('fr-FR')
      }))
    )
  );

  localitesParProvinceChart = computed(() =>
    this.toChartItems(
      this.groupLocalitesByProvince().slice(0, 8).map(item => ({
        label: item.label,
        value: item.occurrenceCount,
        formattedValue: item.occurrenceCount.toLocaleString('fr-FR')
      }))
    )
  );

  localiteSummaryRows = computed(() =>
    this.buildLocaliteSummaryRows().slice(0, 12)
  );

  totalLocalites = computed(() => this.localites().length);

  totalLocalitesActives = computed(() =>
    this.localites().filter(item => item.actif).length
  );

  localitesDistinctProjects = computed(() =>
    this.countDistinct(this.localites().map(item => item.projetId))
  );

  localitesDistinctRegions = computed(() =>
    this.countDistinct(this.localites().map(item => item.regionId))
  );

  localitesDistinctProvinces = computed(() =>
    this.countDistinct(this.localites().map(item => item.provinceId))
  );

  localitesDistinctCommunes = computed(() =>
    this.countDistinct(this.localites().map(item => item.communeId))
  );

  mapMetricOptions: Array<{ value: DashboardMapMetric; label: string }> = [
    { value: 'NOMBRE_IDEES', label: "Nombre d'idees" },
    { value: 'COUT_IDEES', label: 'Cout estime des idees' },
    { value: 'NOMBRE_PROJETS', label: 'Nombre de projets' },
    { value: 'COUT_PROJETS', label: 'Cout total des projets' }
  ];

  selectedMapMetricLabel = computed(() =>
    this.mapMetricOptions.find(item => item.value === this.selectedMapMetric())?.label
    ?? this.mapMetricOptions[0].label
  );

  currentMapScopeLabel = computed(() => 'Regions du Burkina');

  mapLegendTitle = computed(() => 'Regions');

  hasMapFeatures = computed(() =>
    (this.mapFeatureCollection()?.features.length ?? 0) > 0
  );

  mapLegendItems = computed<DashboardMapLegendItem[]>(() =>
    (this.mapFeatureCollection()?.features ?? []).map((feature, index) => ({
      id: this.getMapFeatureId(feature, index),
      label: this.getMapFeatureLabel(feature),
      color: this.getFeaturePaletteColor(index)
    }))
  );

  regionMapStats = computed(() => this.buildRegionMapStats());

  regionalMetricOptions: Array<{ value: RegionalStatisticMetric; label: string; usesCible: boolean }> = [
    { value: 'IDEES_PAR_REGION', label: "Nombre d'idees de projets par region", usesCible: false },
    { value: 'PROJETS_PAR_REGION', label: 'Nombre de projets par region', usesCible: false },
    { value: 'PROJETS_PAR_CIBLE_REGION', label: 'Nombre de projets par cible et par region', usesCible: true },
    { value: 'MONTANTS_PROJETS_PAR_CIBLE_REGION', label: 'Montant total des projets par cible et par region', usesCible: true }
  ];

  selectedRegionalMetricOption = computed(() =>
    this.regionalMetricOptions.find(item => item.value === this.selectedRegionalMetric())
    ?? this.regionalMetricOptions[0]
  );

  shouldShowCibleFilter = computed(() => this.selectedRegionalMetricOption().usesCible);

  selectedCibleLabel = computed(() => {
    if (this.selectedCibleId() === 'ALL') {
      return 'Toutes les cibles';
    }

    const cible = this.cibles().find(item => item.id === this.selectedCibleId());
    return cible ? this.getCibleLabel(cible) : 'Cible inconnue';
  });

  regionalMetricTotal = computed(() =>
    this.regionMapStats().reduce((sum, item) => sum + item.value, 0)
  );

  regionalLegendItems = computed(() =>
    this.regionMapStats()
      .filter(item => !!item.mapEntity.geomObject)
      .map(item => ({
        region: item.region,
        color: this.getRegionPaletteColor(item.region.id)
      }))
  );

  mappedRegionsCount = computed(() =>
    this.regionMapStats().filter(item => !!item.mapEntity.geomObject).length
  );

  regionsWithLocalitesCount = computed(() =>
    this.regionMapStats().filter(item => item.value > 0).length
  );

  regionsWithoutLocalitesCount = computed(() =>
    this.regionMapStats().filter(item => item.value === 0).length
  );

  topMappedRegions = computed(() =>
    [...this.regionMapStats()]
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value || b.projectCount - a.projectCount)
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.loadStats();
    this.loadProjets();
    if (this.showAdminStatisticTabs()) {
      this.loadCibles();
      this.loadCarteRegions();
    }
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data)
    });
  }

  ngOnDestroy(): void {
    this.destroyLocaliteMap();
  }

  canExportStats(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  showAdminStatisticTabs(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  setTab(tab: DashboardTab): void {
    const previousTab = this.activeTab();
    this.activeTab.set(tab);
    if (previousTab === 'localites' && tab !== 'localites') {
      this.destroyLocaliteMap();
    }
    if (tab === 'localites') {
      if (!this.mapFeatureCollection()) {
        this.loadCarteRegions();
        return;
      }
      this.scheduleLocaliteMapRender();
    }
  }

  onMapMetricChange(metric: string): void {
    this.selectedMapMetric.set(metric as DashboardMapMetric);
    this.scheduleLocaliteMapRender();
  }

  onCibleChange(cibleId: string): void {
    this.selectedCibleId.set(cibleId || 'ALL');
    this.selectedMapFeature.set(null);
    this.reloadCurrentMapLevel();
  }

  isGeneralTabActive(): boolean {
    return !this.showAdminStatisticTabs() || this.activeTab() === 'general';
  }

  isLocalitesTabActive(): boolean {
    return this.showAdminStatisticTabs() && this.activeTab() === 'localites';
  }

  goToRegions(): void {
    this.selectedMapRegionId.set(null);
    this.selectedMapRegionName.set(null);
    this.selectedMapProvinceId.set(null);
    this.selectedMapProvinceName.set(null);
    this.selectedMapFeature.set(null);
    this.loadCarteRegions();
  }

  goToProvinces(): void {
    const regionId = this.selectedMapRegionId();
    if (!regionId) {
      this.goToRegions();
      return;
    }

    this.selectedMapProvinceId.set(null);
    this.selectedMapProvinceName.set(null);
    this.selectedMapFeature.set(null);
    this.loadCarteProvinces(regionId);
  }

  loadStats(): void {
    this.loadingStats.set(true);
    this.apiService.get<DashboardStats>('/dashboard/statistiques').subscribe({
      next: (data) => {
        this.stats.set(this.withDefaults(data));
        this.loadingStats.set(false);
      },
      error: () => {
        this.stats.set(this.emptyStats());
        this.loadingStats.set(false);
      }
    });
  }

  loadCibles(): void {
    this.ciblesService.getAll().pipe(
      catchError(() => of([] as Cible[]))
    ).subscribe({
      next: (data) => this.cibles.set((data ?? []).filter(item => item.actif !== false))
    });
  }

  loadCarteRegions(): void {
    this.loadingLocalites.set(true);
    this.selectedMapLevel.set('REGION');
    this.selectedMapRegionId.set(null);
    this.selectedMapRegionName.set(null);
    this.selectedMapProvinceId.set(null);
    this.selectedMapProvinceName.set(null);
    this.selectedMapFeature.set(null);
    this.dashboardService.getCarteRegions(this.getSelectedCibleIdOrUndefined()).pipe(
      catchError(() => of({ type: 'FeatureCollection', features: [] } as GeoJsonFeatureCollection))
    ).subscribe({
      next: (data) => {
        this.mapFeatureCollection.set(this.normalizeFeatureCollection(data));
        this.loadingLocalites.set(false);
        this.scheduleLocaliteMapRender();
      }
    });
  }

  loadCarteProvinces(regionId: string): void {
    this.loadingLocalites.set(true);
    const previousCollection = this.mapFeatureCollection();
    const previousLevel = this.selectedMapLevel();
    this.selectedMapLevel.set('PROVINCE');
    this.dashboardService.getCarteProvinces(regionId, this.getSelectedCibleIdOrUndefined()).pipe(
      catchError(() => of({ type: 'FeatureCollection', features: [] } as GeoJsonFeatureCollection))
    ).subscribe({
      next: (data) => {
        const normalized = this.normalizeFeatureCollection(data);
        if ((normalized.features?.length ?? 0) === 0) {
          this.selectedMapLevel.set(previousLevel);
          this.mapFeatureCollection.set(previousCollection);
          this.loadingLocalites.set(false);
          this.scheduleLocaliteMapRender();
          return;
        }

        this.mapFeatureCollection.set(normalized);
        this.loadingLocalites.set(false);
        this.scheduleLocaliteMapRender();
      }
    });
  }

  loadCarteCommunes(provinceId: string): void {
    this.loadingLocalites.set(true);
    const previousCollection = this.mapFeatureCollection();
    const previousLevel = this.selectedMapLevel();
    this.selectedMapLevel.set('COMMUNE');
    this.dashboardService.getCarteCommunes(provinceId, this.getSelectedCibleIdOrUndefined()).pipe(
      catchError(() => of({ type: 'FeatureCollection', features: [] } as GeoJsonFeatureCollection))
    ).subscribe({
      next: (data) => {
        const normalized = this.normalizeFeatureCollection(data);
        if ((normalized.features?.length ?? 0) === 0) {
          this.selectedMapLevel.set(previousLevel);
          this.mapFeatureCollection.set(previousCollection);
          this.loadingLocalites.set(false);
          this.scheduleLocaliteMapRender();
          return;
        }

        this.mapFeatureCollection.set(normalized);
        this.loadingLocalites.set(false);
        this.scheduleLocaliteMapRender();
      }
    });
  }

  reloadCurrentMapLevel(): void {
    if (this.selectedMapLevel() === 'COMMUNE' && this.selectedMapProvinceId()) {
      this.loadCarteCommunes(this.selectedMapProvinceId()!);
      return;
    }

    if (this.selectedMapLevel() === 'PROVINCE' && this.selectedMapRegionId()) {
      this.loadCarteProvinces(this.selectedMapRegionId()!);
      return;
    }

    this.loadCarteRegions();
  }

  loadLocalites(): void {
    this.loadingLocalites.set(true);
    this.cartographieService.getAll().subscribe({
      next: (data) => {
        this.localites.set(Array.isArray(data) ? data : []);
        this.loadingLocalites.set(false);
        this.scheduleLocaliteMapRender();
      },
      error: () => {
        this.localites.set([]);
        this.loadingLocalites.set(false);
      }
    });
  }

  loadRegionalStatisticInputs(): void {
    this.loadingLocalites.set(true);

    forkJoin({
      projets: this.projetsService.getAll().pipe(catchError(() => of([] as Projet[]))),
      idees: this.ideesProjetService.getAll().pipe(catchError(() => of([] as IdeeProjet[]))),
      cibles: this.ciblesService.getAll().pipe(catchError(() => of([] as Cible[]))),
      localitesProjet: this.cartographieService.getAll().pipe(catchError(() => of([] as LocaliteIntervention[])))
    }).pipe(
      switchMap(({ projets, idees, cibles, localitesProjet }) => {
        const ideaLocalityRequests = idees
          .filter(item => item.actif !== false)
          .map(idee =>
            this.localitesInterventionService.getByIdeeProjet(idee.id).pipe(
              catchError(() => of([] as IdeeProjetLocaliteIntervention[])),
              map(localites => localites.map(localite => ({
                ...localite,
                ideeProjetId: idee.id
              })))
            )
          );

        return forkJoin({
          projets: of(projets.filter(item => item.actif !== false)),
          idees: of(idees.filter(item => item.actif !== false)),
          cibles: of(cibles.filter(item => item.actif !== false)),
          localitesProjet: of(localitesProjet.filter(item => item.actif !== false)),
          ideeLocalites: ideaLocalityRequests.length > 0
            ? forkJoin(ideaLocalityRequests).pipe(map(items => items.flat()))
            : of([] as IdeeRegionLocalite[])
        });
      })
    ).subscribe({
      next: ({ projets, idees, cibles, localitesProjet, ideeLocalites }) => {
        this.projetsCatalogue.set(projets);
        this.ideesCatalogue.set(idees);
        this.cibles.set(cibles);
        this.localites.set(localitesProjet);
        this.ideeLocalites.set(ideeLocalites);
        this.loadingLocalites.set(false);
        this.scheduleLocaliteMapRender();
      },
      error: () => {
        this.projetsCatalogue.set([]);
        this.ideesCatalogue.set([]);
        this.cibles.set([]);
        this.localites.set([]);
        this.ideeLocalites.set([]);
        this.loadingLocalites.set(false);
      }
    });
  }

  loadRegions(): void {
    this.regionsService.getActifs().subscribe({
      next: (data) => {
        this.regions.set(Array.isArray(data) ? data : []);
        this.scheduleLocaliteMapRender();
      },
      error: () => {
        this.regionsService.getAll().subscribe({
          next: (data) => {
            this.regions.set(Array.isArray(data) ? data : []);
            this.scheduleLocaliteMapRender();
          },
          error: () => this.regions.set([])
        });
      }
    });
  }

  loadProjets(): void {
    this.apiService.get('/projet?size=5').subscribe({
      next: (data: any) => this.projets.set(Array.isArray(data) ? data : data.content || []),
      error: () => this.projets.set([])
    });
  }

  private emptyStats(): DashboardStats {
    return {
      totalIdees: 0,
      totalProjets: 0,
      totalProjetsActifs: 0,
      ideesEnMaturation: 0,
      projetsEnPlanification: 0,
      projetsEnExecution: 0,
      tauxTransformationIdeesEnProjets: 0,
      tauxRejetIdees: 0,
      projetsParPipAnnuel: [],
      montantParPipAnnuel: [],
      repartitionTypeProjetPip: [],
      projetsParSecteur: [],
      montantParSecteur: [],
      ideesParCible: [],
      projetsParCible: []
    };
  }

  private withDefaults(stats: Partial<DashboardStats> | null | undefined): DashboardStats {
    return {
      ...this.emptyStats(),
      ...stats,
      projetsParPipAnnuel: stats?.projetsParPipAnnuel ?? [],
      montantParPipAnnuel: stats?.montantParPipAnnuel ?? [],
      repartitionTypeProjetPip: stats?.repartitionTypeProjetPip ?? [],
      projetsParSecteur: stats?.projetsParSecteur ?? [],
      montantParSecteur: stats?.montantParSecteur ?? [],
      ideesParCible: stats?.ideesParCible ?? [],
      projetsParCible: stats?.projetsParCible ?? []
    };
  }

  private toChartItems(items: Array<{ label: string; value: number; formattedValue: string }>): ChartItem[] {
    const max = Math.max(...items.map(item => item.value), 0);
    return items.map(item => ({
      ...item,
      percent: max > 0 ? (item.value / max) * 100 : 0
    }));
  }

  private groupLocalitesByType(): Array<{ typeLocalite: TypeLocalite; occurrenceCount: number }> {
    const groups = new Map<TypeLocalite, number>();

    for (const item of this.localites()) {
      groups.set(item.typeLocalite, (groups.get(item.typeLocalite) ?? 0) + 1);
    }

    return Array.from(groups.entries())
      .map(([typeLocalite, occurrenceCount]) => ({ typeLocalite, occurrenceCount }))
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  private groupLocalitesByRegion(): Array<{ label: string; occurrenceCount: number }> {
    return this.groupLocalitesByLabel(
      item => item.regionId || item.regionNom || this.getLocaliteLabel(item),
      item => item.regionNom || 'Region non renseignee'
    );
  }

  private groupLocalitesByProvince(): Array<{ label: string; occurrenceCount: number }> {
    return this.groupLocalitesByLabel(
      item => item.provinceId || item.provinceNom || this.getLocaliteLabel(item),
      item => item.provinceNom || 'Province non renseignee'
    );
  }

  private groupLocalitesByLabel(
    keySelector: (item: LocaliteIntervention) => string,
    labelSelector: (item: LocaliteIntervention) => string
  ): Array<{ label: string; occurrenceCount: number }> {
    const groups = new Map<string, { label: string; occurrenceCount: number }>();

    for (const item of this.localites()) {
      const key = keySelector(item);
      const current = groups.get(key);
      if (current) {
        current.occurrenceCount += 1;
        continue;
      }
      groups.set(key, { label: labelSelector(item), occurrenceCount: 1 });
    }

    return Array.from(groups.values()).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  private buildLocaliteSummaryRows(): LocaliteSummaryItem[] {
    const groups = new Map<string, LocaliteSummaryItem & { projectIds: Set<string> }>();

    for (const item of this.localites()) {
      const label = this.getLocaliteLabel(item);
      const key = [
        item.typeLocalite,
        item.regionId || item.regionNom || '',
        item.provinceId || item.provinceNom || '',
        item.communeId || item.communeNom || '',
        item.villageId || item.villageNom || label
      ].join('::');
      const current = groups.get(key);

      if (current) {
        current.occurrenceCount += 1;
        current.activeCount += item.actif ? 1 : 0;
        current.projectIds.add(item.projetId);
        continue;
      }

      groups.set(key, {
        key,
        label,
        typeLocalite: item.typeLocalite,
        regionNom: item.regionNom || '-',
        provinceNom: item.provinceNom || '-',
        communeNom: item.communeNom || '-',
        occurrenceCount: 1,
        projectCount: 0,
        activeCount: item.actif ? 1 : 0,
        projectIds: new Set(item.projetId ? [item.projetId] : [])
      });
    }

    return Array.from(groups.values())
      .map(item => ({
        key: item.key,
        label: item.label,
        typeLocalite: item.typeLocalite,
        regionNom: item.regionNom,
        provinceNom: item.provinceNom,
        communeNom: item.communeNom,
        occurrenceCount: item.occurrenceCount,
        projectCount: item.projectIds.size,
        activeCount: item.activeCount
      }))
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount || b.projectCount - a.projectCount);
  }

  private getLocaliteLabel(item: LocaliteIntervention): string {
    return item.nomComplet
      || item.villageNom
      || item.communeNom
      || item.provinceNom
      || item.regionNom
      || 'Localite non renseignee';
  }

  private countDistinct(values: Array<string | undefined>): number {
    return new Set(values.filter((value): value is string => !!value)).size;
  }

  private buildRegionMapStats(): LocaliteRegionMapStat[] {
    const ideasById = new Map(this.ideesCatalogue().map(item => [item.id, item]));
    const projectsById = new Map(this.projetsCatalogue().map(item => [item.id, item]));
    const statsByRegion = new Map<string, { value: number; projectIds: Set<string>; ideaIds: Set<string>; amountTotal: number }>();
    const metric = this.selectedRegionalMetric();
    const selectedCibleId = this.selectedCibleId();

    const getRegionEntry = (regionKey: string) => {
      const existing = statsByRegion.get(regionKey);
      if (existing) {
        return existing;
      }

      const created = {
        value: 0,
        projectIds: new Set<string>(),
        ideaIds: new Set<string>(),
        amountTotal: 0
      };
      statsByRegion.set(regionKey, created);
      return created;
    };

    if (metric === 'IDEES_PAR_REGION') {
      const seen = new Set<string>();

      for (const item of this.ideeLocalites()) {
        const regionKey = item.regionId || item.regionNom;
        if (!regionKey || !item.ideeProjetId) {
          continue;
        }

        const dedupeKey = `${regionKey}::${item.ideeProjetId}`;
        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        const entry = getRegionEntry(regionKey);
        entry.value += 1;
        entry.ideaIds.add(item.ideeProjetId);
      }
    } else {
      const seen = new Set<string>();

      for (const item of this.localites()) {
        const regionKey = item.regionId || item.regionNom;
        const projetId = item.projetId;
        if (!regionKey || !projetId) {
          continue;
        }

        const projet = projectsById.get(projetId);
        if (!projet) {
          continue;
        }

        if ((metric === 'PROJETS_PAR_CIBLE_REGION' || metric === 'MONTANTS_PROJETS_PAR_CIBLE_REGION')
          && !this.projectMatchesSelectedCible(projet, selectedCibleId, ideasById)) {
          continue;
        }

        const dedupeKey = `${regionKey}::${projetId}`;
        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        const entry = getRegionEntry(regionKey);
        entry.projectIds.add(projetId);
        if (projet.ideeProjetId) {
          entry.ideaIds.add(projet.ideeProjetId);
        }

        if (metric === 'MONTANTS_PROJETS_PAR_CIBLE_REGION') {
          const montant = Number(projet.coutTotal ?? 0);
          entry.value += montant;
          entry.amountTotal += montant;
        } else {
          entry.value += 1;
          entry.amountTotal += Number(projet.coutTotal ?? 0);
        }
      }
    }

    return this.regions().map(region => {
      const stats = statsByRegion.get(region.id)
        ?? statsByRegion.get(region.nom)
        ?? { value: 0, projectIds: new Set<string>(), ideaIds: new Set<string>(), amountTotal: 0 };

      return {
        region,
        mapEntity: toMapEntity(region),
        value: stats.value,
        ideaCount: stats.ideaIds.size,
        projectCount: stats.projectIds.size,
        amountTotal: stats.amountTotal,
        localiteCount: stats.value,
        activeCount: 0
      };
    });
  }

  private projectMatchesSelectedCible(
    projet: Projet,
    cibleId: string,
    ideasById: Map<string, IdeeProjet>
  ): boolean {
    if (cibleId === 'ALL') {
      return true;
    }

    if (!projet.ideeProjetId) {
      return false;
    }

    const idee = ideasById.get(projet.ideeProjetId);
    return !!idee?.cibleIds?.includes(cibleId);
  }

  private getSelectedRegionalMetricLabel(): string {
    return this.selectedRegionalMetricOption().label;
  }

  private getRegionalMetricValueLabel(value: number): string {
    if (this.selectedRegionalMetric() === 'MONTANTS_PROJETS_PAR_CIBLE_REGION') {
      return this.formatCurrency(value);
    }

    return value.toLocaleString('fr-FR');
  }

  private getRegionalMarkerValueLabel(value: number): string {
    if (value <= 0) {
      return '';
    }

    if (this.selectedRegionalMetric() === 'MONTANTS_PROJETS_PAR_CIBLE_REGION') {
      return this.formatCompactNumber(value);
    }

    return value.toLocaleString('fr-FR');
  }

  getCibleLabel(cible: Cible): string {
    return cible.libelle || cible.nom || cible.id;
  }

  formatRegionalMetricTotal(): string {
    return this.getRegionalMetricValueLabel(this.regionalMetricTotal());
  }

  private scheduleLocaliteMapRender(): void {
    if (!this.isLocalitesTabActive()) {
      return;
    }

    window.setTimeout(() => {
      void this.renderLocaliteMap();
    }, 0);
  }

  private async renderLocaliteMap(): Promise<void> {
    if (!this.isLocalitesTabActive()) {
      return;
    }

    const host = this.localiteMapHost?.nativeElement;
    if (!host) {
      return;
    }

    const L = await this.ensureLeafletLoaded();

    if (this.localiteMap && this.localiteMapHostElement !== host) {
      this.destroyLocaliteMap();
    }

    if (!this.localiteMap) {
      this.localiteMap = L.map(host, {
        zoomControl: true,
        attributionControl: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        maxBoundsViscosity: 1
      });
      this.localiteMap.setView([12.35, -1.55], 6);
      this.localiteMap.on('zoomend', () => {
        const layerBounds = this.localiteGeoJsonLayer?.getBounds?.();
        if (!layerBounds?.isValid?.()) {
          return;
        }

        this.localiteMap.panInsideBounds(layerBounds.pad(0.12), { animate: false });
      });
      this.localiteMapHostElement = host;
    }

    this.clearLocaliteMapLayers();

    const featureCollection = this.mapFeatureCollection();
    const features = featureCollection?.features ?? [];
    if (features.length === 0) {
      this.localiteMap.invalidateSize();
      return;
    }

    const featureColors = new Map<string, string>();
    features.forEach((feature, index) => {
      featureColors.set(
        this.getMapFeatureId(feature, index),
        this.getFeaturePaletteColor(index)
      );
    });

    this.localiteGeoJsonLayer = L.geoJSON(featureCollection as any, {
      style: (feature: any) => {
        const featureId = this.getMapFeatureId(feature, 0);
        return {
          color: '#ffffff',
          weight: 1.5,
          fillColor: featureColors.get(featureId) ?? '#94a3b8',
          fillOpacity: 1
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const typedFeature = feature as DashboardGeoJsonFeature;
        const props = typedFeature.properties;
        const featureId = this.getMapFeatureId(feature, 0);
        const featureColor = featureColors.get(featureId) ?? '#334155';
        layer.bindPopup(this.buildFeaturePopup(props, featureColor), {
          className: 'dashboard-map-popup',
          autoPan: true,
          autoPanPaddingTopLeft: [24, 170],
          autoPanPaddingBottomRight: [24, 32]
        });
        layer.on('click', () => this.handleMapFeatureClick(typedFeature));
        layer.on('mouseover', () => {
          layer.setStyle({
            weight: 3,
            color: '#1f2937',
            fillColor: featureColor,
            fillOpacity: 1
          });
          if (typeof layer.bringToFront === 'function') {
            layer.bringToFront();
          }
        });
        layer.on('mouseout', () => {
          this.localiteGeoJsonLayer?.resetStyle(layer);
        });
      }
    }).addTo(this.localiteMap);

    this.localiteMarkerLayer = L.layerGroup(
      features
        .filter(feature => this.isPointGeometry(feature.properties?.centroid))
        .map((feature: DashboardGeoJsonFeature) => {
          const metricValue = this.getSelectedMetricValue(feature.properties);
          const coords = (feature.properties.centroid as GeoJSON.Point).coordinates as [number, number];
          return L.marker([coords[1], coords[0]], {
            icon: L.divIcon({
              className: 'dashboard-map-label',
              html: `<span>${this.getMarkerMetricLabel(metricValue)}</span>`
            })
          });
        })
    ).addTo(this.localiteMap);

    const bounds = this.localiteGeoJsonLayer.getBounds();
    if (bounds?.isValid?.()) {
      const paddedBounds = bounds.pad(0.06);
      const fittedZoom = this.localiteMap.getBoundsZoom(paddedBounds, false, [52, 52]);
      const boundedArea = paddedBounds.pad(0.16);
      this.localiteMap.setMinZoom(fittedZoom);
      this.localiteMap.setMaxZoom(fittedZoom + 0.5);
      this.localiteMap.setMaxBounds(boundedArea);
      this.localiteMap.fitBounds(paddedBounds, {
        padding: [52, 52],
        maxZoom: fittedZoom,
        animate: false
      });
      this.localiteMap.setView(paddedBounds.getCenter(), this.localiteMap.getZoom(), { animate: false });
      this.localiteMap.panInsideBounds(boundedArea, { animate: false });
    }
    this.localiteMap.invalidateSize();
  }

  private async ensureLeafletLoaded(): Promise<any> {
    if (!this.leafletLib) {
      this.leafletLib = await import('leaflet');
    }
    return this.leafletLib;
  }

  private normalizeFeatureCollection(collection: GeoJsonFeatureCollection | null | undefined): GeoJsonFeatureCollection {
    return {
      type: 'FeatureCollection',
      features: Array.isArray(collection?.features)
        ? collection!.features.filter(feature => !!feature?.geometry && !!feature?.properties)
        : []
    };
  }

  private getSelectedCibleIdOrUndefined(): string | undefined {
    return this.selectedCibleId() === 'ALL' ? undefined : this.selectedCibleId();
  }

  private getMapFeatureId(feature: Pick<DashboardGeoJsonFeature, 'properties'>, index: number): string {
    return feature.properties?.id || `feature-${index}`;
  }

  private getMapFeatureLabel(feature: Pick<DashboardGeoJsonFeature, 'properties'>): string {
    return feature.properties?.nom || 'Sans nom';
  }

  private getFeaturePaletteColor(index: number): string {
    return REGION_PALETTE[index % REGION_PALETTE.length];
  }

  private getRegionAccentColor(properties: DashboardMapProperties): string {
    const key = String(
      properties.niveau === 'REGION'
        ? properties.id || properties.code || properties.nom
        : ('regionId' in properties && properties.regionId)
          || properties.id
          || properties.code
          || properties.nom
          || 'region'
    );
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) {
      hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    }
    return REGION_PALETTE[hash % REGION_PALETTE.length];
  }

  private getPopupRegionName(properties: DashboardMapProperties): string {
    if (properties.niveau === 'REGION') {
      return properties.nom;
    }

    if ('regionNom' in properties && properties.regionNom) {
      return properties.regionNom;
    }

    return properties.nom;
  }

  getColorByProjects(value: number): string {
    if (value >= 20) return '#7f1d1d';
    if (value >= 10) return '#b45309';
    if (value >= 5) return '#d97706';
    if (value >= 1) return '#65a30d';
    return '#d1d5db';
  }

  private getSelectedMetricValue(properties: DashboardMapProperties): number {
    switch (this.selectedMapMetric()) {
      case 'NOMBRE_IDEES':
        return Number(properties.nombreIdees ?? 0);
      case 'COUT_IDEES':
        return Number(properties.coutEstimeIdees ?? 0);
      case 'COUT_PROJETS':
        return Number(properties.coutTotalProjets ?? 0);
      case 'NOMBRE_PROJETS':
      default:
        return Number(properties.nombreProjets ?? 0);
    }
  }

  private formatMapMetricValue(metric: DashboardMapMetric, value: number): string {
    if (metric === 'COUT_IDEES' || metric === 'COUT_PROJETS') {
      return this.formatCurrency(value);
    }

    return value.toLocaleString('fr-FR');
  }

  private getMarkerMetricLabel(value: number): string {
    if (value <= 0) {
      return '';
    }

    if (this.selectedMapMetric() === 'COUT_IDEES' || this.selectedMapMetric() === 'COUT_PROJETS') {
      return this.formatCompactNumber(value);
    }

    return value.toLocaleString('fr-FR');
  }

  private buildFeaturePopup(properties: DashboardMapProperties, featureColor: string): string {
    const selectedMetricValue = this.formatMapMetricValue(
      this.selectedMapMetric(),
      this.getSelectedMetricValue(properties)
    );
    const regionName = this.getPopupRegionName(properties);
    const regionColor = this.getRegionAccentColor(properties);

    const extra: string[] = [];
    if (properties.niveau === 'REGION' && properties.ancien_nom) {
      extra.push(`<div>Ancien nom: ${properties.ancien_nom}</div>`);
    }
    if (properties.niveau === 'PROVINCE') {
      extra.push(`<div>Region: ${properties.regionNom}</div>`);
    }
    if (properties.niveau === 'COMMUNE') {
      extra.push(`<div>Province: ${properties.provinceNom}</div>`);
      if (properties.typeCommune) {
        extra.push(`<div>Type: ${properties.typeCommune}</div>`);
      }
    }

    return [
      `<div class="dashboard-map-tooltip">`,
      `<div class="dashboard-map-tooltip__title" style="background:${featureColor}">${properties.nom}</div>`,
      `<div class="dashboard-map-tooltip__region"><span style="background:${regionColor}"></span>Region: ${regionName}</div>`,
      `<div>Code: ${properties.code || '-'}</div>`,
      ...extra,
      `<div>${this.selectedMapMetricLabel()}: ${selectedMetricValue}</div>`,
      `<div>Idees: ${properties.nombreIdees.toLocaleString('fr-FR')}</div>`,
      `<div>Projets: ${properties.nombreProjets.toLocaleString('fr-FR')}</div>`,
      `<div>Cout idees: ${this.formatCurrency(properties.coutEstimeIdees)}</div>`,
      `<div>Cout projets: ${this.formatCurrency(properties.coutTotalProjets)}</div>`,
      `</div>`
    ].join('');
  }

  private handleMapFeatureClick(feature: DashboardGeoJsonFeature): void {
    const properties = feature.properties;
    this.selectedMapFeature.set(feature);
    this.selectedMapRegionId.set(properties.niveau === 'REGION' ? properties.id : null);
    this.selectedMapRegionName.set(properties.niveau === 'REGION' ? properties.nom : null);
    this.selectedMapProvinceId.set(null);
    this.selectedMapProvinceName.set(null);
  }

  private isRegionProperties(properties: DashboardMapProperties): properties is RegionMapProperties {
    return properties.niveau === 'REGION';
  }

  private clearLocaliteMapLayers(): void {
    if (this.localiteGeoJsonLayer && this.localiteMap) {
      this.localiteMap.removeLayer(this.localiteGeoJsonLayer);
      this.localiteGeoJsonLayer = null;
    }

    if (this.localiteMarkerLayer && this.localiteMap) {
      this.localiteMap.removeLayer(this.localiteMarkerLayer);
      this.localiteMarkerLayer = null;
    }

    if (this.localiteLegendControl && this.localiteMap) {
      this.localiteMap.removeControl(this.localiteLegendControl);
      this.localiteLegendControl = null;
    }
  }

  private destroyLocaliteMap(): void {
    this.clearLocaliteMapLayers();
    if (this.localiteMap) {
      this.localiteMap.remove();
      this.localiteMap = null;
    }
    this.localiteMapHostElement = null;
  }

  private addLocaliteLegend(L: any, maxValue: number): void {
    if (!this.localiteMap) {
      return;
    }

    this.localiteLegendControl = L.control({ position: 'bottomright' });
    this.localiteLegendControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'dashboard-map-legend');
      const grades = this.getLegendGrades(maxValue);
      div.innerHTML = `
        <div class="dashboard-map-legend__title">Localités par région</div>
        ${grades.map((grade, index) => {
          const next = grades[index + 1];
          const label = next !== undefined
            ? `${this.getRegionalMetricValueLabel(grade)} - ${this.getRegionalMetricValueLabel(Math.max(next - 1, grade))}`
            : `${this.getRegionalMetricValueLabel(grade)}+`;
          return `
            <div class="dashboard-map-legend__item">
              <span class="dashboard-map-legend__swatch" style="background:${this.getRegionFillColor(grade, maxValue)}"></span>
              <span>${label}</span>
            </div>
          `;
        }).join('')}
      `;
      div.innerHTML = div.innerHTML.replace(
        /<div class="dashboard-map-legend__title">.*?<\/div>/,
        `<div class="dashboard-map-legend__title">${this.getSelectedRegionalMetricLabel()}</div>`
      );
      return div;
    };
    this.localiteLegendControl.addTo(this.localiteMap);
  }

  private getLegendGrades(maxValue: number): number[] {
    if (maxValue <= 0) {
      return [0];
    }

    const steps = 4;
    const grades = Array.from({ length: steps + 1 }, (_, index) =>
      Math.round((maxValue / steps) * index)
    );

    return Array.from(new Set(grades)).sort((a, b) => a - b);
  }

  getRegionPaletteColor(regionId: string): string {
    const index = this.regions().findIndex(item => item.id === regionId);
    const safeIndex = index >= 0 ? index : 0;
    return REGION_PALETTE[safeIndex % REGION_PALETTE.length];
  }

  private getRegionFillColor(value: number, maxValue: number): string {
    if (value <= 0 || maxValue <= 0) return '#e2e8f0';

    const ratio = value / maxValue;
    if (ratio >= 0.85) return '#14532d';
    if (ratio >= 0.6) return '#15803d';
    if (ratio >= 0.35) return '#22c55e';
    if (ratio >= 0.15) return '#86efac';
    return '#dcfce7';
  }

  private isPointGeometry(value: unknown): boolean {
    return !!value
      && typeof value === 'object'
      && (value as { type?: string }).type === 'Point'
      && Array.isArray((value as { coordinates?: unknown }).coordinates);
  }

  formatSurface(value: number | undefined): string {
    if (value === undefined || value === null) {
      return '-';
    }
    return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km2`;
  }

  hasAncienNom(feature: DashboardGeoJsonFeature | null | undefined): boolean {
    return !!feature && this.isRegionProperties(feature.properties) && !!feature.properties.ancien_nom;
  }

  getAncienNom(feature: DashboardGeoJsonFeature | null | undefined): string {
    return this.hasAncienNom(feature) ? (feature!.properties as RegionMapProperties).ancien_nom ?? '-' : '-';
  }

  isProvinceFeature(feature: DashboardGeoJsonFeature | null | undefined): boolean {
    return feature?.properties?.niveau === 'PROVINCE';
  }

  isCommuneFeature(feature: DashboardGeoJsonFeature | null | undefined): boolean {
    return feature?.properties?.niveau === 'COMMUNE';
  }

  getFeatureRegionNom(feature: DashboardGeoJsonFeature | null | undefined): string {
    return this.isProvinceFeature(feature) ? (feature!.properties as ProvinceMapProperties).regionNom : '-';
  }

  getFeatureProvinceNom(feature: DashboardGeoJsonFeature | null | undefined): string {
    return this.isCommuneFeature(feature) ? (feature!.properties as CommuneMapProperties).provinceNom : '-';
  }

  hasFeatureTypeCommune(feature: DashboardGeoJsonFeature | null | undefined): boolean {
    return this.isCommuneFeature(feature) && !!(feature!.properties as CommuneMapProperties).typeCommune;
  }

  getFeatureTypeCommune(feature: DashboardGeoJsonFeature | null | undefined): string {
    return this.hasFeatureTypeCommune(feature) ? (feature!.properties as CommuneMapProperties).typeCommune ?? '-' : '-';
  }

  formatCompactNumber(value: number | undefined): string {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  formatCurrency(value: number | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  formatCurrencyForExport(value: number | undefined): string {
    const amount = Math.round(value ?? 0);
    const formatted = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FCFA`;
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '0 FCFA';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + ' T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  formatPercent(value: number | undefined): string {
    return `${(value ?? 0).toFixed(2)}%`;
  }

  getStatusClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_COURS: 'badge-warning',
      TERMINE: 'badge-success',
      SUSPENDU: 'badge-danger',
      PLANIFIE: 'badge-info',
      EN_EXECUTION: 'badge-warning',
      PIP_FINANCIER_CREE: 'badge-info'
    };
    return classes[statut] || 'badge-secondary';
  }

  getTypeLocaliteLabel(type: TypeLocalite): string {
    switch (type) {
      case 'REGION':
        return 'Region';
      case 'PROVINCE':
        return 'Province';
      case 'COMMUNE':
        return 'Commune';
      case 'VILLAGE':
        return 'Village / Secteur';
      default:
        return type;
    }
  }

  getMinistereNom(projet: any): string {
    if (projet.ministere?.sigle) return projet.ministere.sigle;
    if (projet.ministere?.nom) return projet.ministere.nom;
    if (projet.ministereId) {
      const ministere = this.ministeres().find(item => item.id === projet.ministereId);
      return ministere ? (ministere.sigle || ministere.nom) : '-';
    }
    return '-';
  }

  getProjetTitre(projet: any): string {
    return projet.titre || projet.intitule || '-';
  }

  getProgression(projet: any): number {
    return projet.tauxExecution || 0;
  }

  async exportStatsToExcel(): Promise<void> {
    if (!this.canExportStats() || !this.isGeneralTabActive()) return;

    this.exporting.set(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      const workbook = utils.book_new();

      const summaryHeaders = ['Indicateur', 'Valeur'];
      const summaryRows = this.buildSummaryRows();
      const summarySheet = utils.aoa_to_sheet([
        summaryHeaders,
        ...summaryRows.map(row => summaryHeaders.map(header => row[header] ?? ''))
      ]);
      this.applyHeaderStyle(utils, summarySheet, summaryHeaders);
      summarySheet['!cols'] = [{ wch: 34 }, { wch: 22 }];
      utils.book_append_sheet(workbook, summarySheet, 'Synthese');

      this.appendArraySheet(workbook, utils, 'Projets par PIP', ['Année', 'Nombre de projets'],
        this.stats().projetsParPipAnnuel.map(item => ({
          'Année': item.annee,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Montant par PIP', ['Année', 'Montant total'],
        this.stats().montantParPipAnnuel.map(item => ({
          'Année': item.annee,
          'Montant total': this.formatCurrencyForExport(item.montantTotal)
        }))
      );

      this.appendArraySheet(workbook, utils, 'Type projet', ['Type', 'Nombre de projets'],
        this.stats().repartitionTypeProjetPip.map(item => ({
          Type: item.typeProjetPip,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Projets secteur', ['Secteur', 'Nombre de projets'],
        this.stats().projetsParSecteur.map(item => ({
          Secteur: item.secteurNom,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Montant secteur', ['Secteur', 'Montant total'],
        this.stats().montantParSecteur.map(item => ({
          Secteur: item.secteurNom,
          'Montant total': this.formatCurrencyForExport(item.montantTotal)
        }))
      );

      this.appendArraySheet(workbook, utils, 'Idées cible', ['Cible', 'Nombre'],
        this.stats().ideesParCible.map(item => ({
          Cible: item.cibleLibelle,
          Nombre: item.nombre
        }))
      );

      this.appendArraySheet(workbook, utils, 'Projets cible', ['Cible', 'Nombre'],
        this.stats().projetsParCible.map(item => ({
          Cible: item.cibleLibelle,
          Nombre: item.nombre
        }))
      );

      writeFile(workbook, this.buildExportFileName('xlsx'), { cellStyles: true });
    } finally {
      this.exporting.set(false);
    }
  }

  async exportStatsToPdf(): Promise<void> {
    if (!this.canExportStats() || !this.isGeneralTabActive()) return;

    this.exporting.set(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const now = new Date();
      const marginLeft = 14;
      let currentY = 15;

      doc.setFontSize(14);
      doc.text('Statistiques du tableau de bord', marginLeft, currentY);
      currentY += 6;
      doc.setFontSize(9);
      doc.text(`Export du ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}`, marginLeft, currentY);

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Indicateur', 'Valeur']],
        body: this.buildSummaryRows().map(row => [row['Indicateur'], String(row['Valeur'])]),
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      const addSection = (
        title: string,
        head: string[],
        body: Array<Array<string | number>>,
        columnStyles?: Record<number, { cellWidth?: number }>
      ) => {
        const finalY = (doc as any).lastAutoTable?.finalY ?? currentY + 20;
        const nextY = finalY + 8;
        doc.setFontSize(11);
        doc.text(title, marginLeft, nextY);
        autoTable(doc, {
          startY: nextY + 2,
          head: [head],
          body,
          headStyles: { fillColor: [5, 150, 105] },
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          columnStyles
        });
      };

      addSection('Projets par PIP annuel', ['Année', 'Nombre de projets'],
        this.stats().projetsParPipAnnuel.map(item => [item.annee, item.nombreProjets]));
      addSection('Montant par PIP annuel', ['Année', 'Montant total'],
        this.stats().montantParPipAnnuel.map(item => [item.annee, this.formatCurrencyForExport(item.montantTotal)]),
        { 0: { cellWidth: 40 }, 1: { cellWidth: 70 } });
      addSection('Répartition par type de projet', ['Type', 'Nombre de projets'],
        this.stats().repartitionTypeProjetPip.map(item => [item.typeProjetPip, item.nombreProjets]));
      addSection('Projets par secteur', ['Secteur', 'Nombre de projets'],
        this.stats().projetsParSecteur.map(item => [item.secteurNom, item.nombreProjets]));
      addSection('Montant par secteur', ['Secteur', 'Montant total'],
        this.stats().montantParSecteur.map(item => [item.secteurNom, this.formatCurrencyForExport(item.montantTotal)]),
        { 0: { cellWidth: 90 }, 1: { cellWidth: 70 } });
      addSection('Idées par cible', ['Cible', 'Nombre'],
        this.stats().ideesParCible.map(item => [item.cibleLibelle, item.nombre]));
      addSection('Projets par cible', ['Cible', 'Nombre'],
        this.stats().projetsParCible.map(item => [item.cibleLibelle, item.nombre]));

      doc.save(this.buildExportFileName('pdf'));
    } finally {
      this.exporting.set(false);
    }
  }

  private buildSummaryRows(): Array<Record<string, string | number>> {
    return [
      { Indicateur: 'Total idées', Valeur: this.stats().totalIdees },
      { Indicateur: 'Total projets', Valeur: this.stats().totalProjets },
      { Indicateur: 'Projets actifs', Valeur: this.stats().totalProjetsActifs },
      { Indicateur: 'Idées en maturation', Valeur: this.stats().ideesEnMaturation },
      { Indicateur: 'Projets en planification', Valeur: this.stats().projetsEnPlanification },
      { Indicateur: 'Projets en exécution', Valeur: this.stats().projetsEnExecution },
      { Indicateur: 'Taux de transformation', Valeur: this.formatPercent(this.stats().tauxTransformationIdeesEnProjets) },
      { Indicateur: 'Taux de rejet', Valeur: this.formatPercent(this.stats().tauxRejetIdees) }
    ];
  }

  private appendArraySheet(
    workbook: any,
    utils: any,
    sheetName: string,
    headers: string[],
    rows: Array<Record<string, string | number>>
  ): void {
    const sheet = utils.aoa_to_sheet([
      headers,
      ...rows.map(row => headers.map(header => row[header] ?? ''))
    ]);
    this.applyHeaderStyle(utils, sheet, headers);
    sheet['!cols'] = headers.map(() => ({ wch: 24 }));
    utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private applyHeaderStyle(utils: any, sheet: any, headers: string[]): void {
    headers.forEach((_, index) => {
      const cellRef = utils.encode_cell({ r: 0, c: index });
      const cell = sheet[cellRef];
      if (!cell) return;

      cell.s = {
        fill: {
          fgColor: { rgb: this.exportHeaderColor }
        },
        font: {
          bold: true,
          color: { rgb: 'FFFFFF' }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };
    });
  }

  private buildExportFileName(extension: 'xlsx' | 'pdf'): string {
    const date = new Date().toISOString().slice(0, 10);
    return `dashboard-statistiques-${date}.${extension}`;
  }
}
