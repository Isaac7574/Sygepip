import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
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

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let cartographieService: jasmine.SpyObj<CartographieService>;
  let regionsService: jasmine.SpyObj<RegionsService>;

  const mockStats = {
    totalIdees: 120,
    totalProjets: 45,
    totalProjetsActifs: 40,
    ideesEnMaturation: 30,
    projetsEnPlanification: 15,
    projetsEnExecution: 10,
    tauxTransformationIdeesEnProjets: 37.5,
    tauxRejetIdees: 12.5,
    projetsParPipAnnuel: [{ pipAnnuelId: '1', annee: 2025, nombreProjets: 20 }],
    montantParPipAnnuel: [{ pipAnnuelId: '1', annee: 2025, montantTotal: 3500000000 }],
    repartitionTypeProjetPip: [{ typeProjetPip: 'NOYAU_SUR', nombreProjets: 12 }],
    projetsParSecteur: [{ secteurId: '1', secteurNom: 'Infrastructures', nombreProjets: 8 }],
    montantParSecteur: [{ secteurId: '1', secteurNom: 'Infrastructures', montantTotal: 1200000000 }],
    ideesParCible: [],
    projetsParCible: []
  };

  const mockProjets = [
    { id: 1, intitule: 'Projet A', code: 'PRJ-001', coutTotal: 5000000000, statut: 'EN_COURS', tauxExecution: 45, ministere: { sigle: 'MEFP' } },
    { id: 2, intitule: 'Projet B', code: 'PRJ-002', coutTotal: 3000000000, statut: 'TERMINE', tauxExecution: 100, ministere: { sigle: 'MINEFID' } }
  ];

  const mockLocalites = [
    { id: '1', projetId: 'P1', typeLocalite: 'REGION', regionId: 'R1', regionNom: 'Centre', actif: true },
    { id: '2', projetId: 'P2', typeLocalite: 'PROVINCE', regionId: 'R1', regionNom: 'Centre', provinceId: 'PR1', provinceNom: 'Kadiogo', actif: true }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    const authSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    const cartographieSpy = jasmine.createSpyObj('CartographieService', ['getAll']);
    const ciblesSpy = jasmine.createSpyObj('CiblesService', ['getAll']);
    const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getCarteRegions', 'getCarteProvinces', 'getCarteCommunes']);
    const ideesSpy = jasmine.createSpyObj('IdeesProjetService', ['getAll']);
    const localitesInterventionSpy = jasmine.createSpyObj('LocalitesInterventionService', ['getByIdeeProjet']);
    const ministereSpy = jasmine.createSpyObj('MinisteresService', ['getAll']);
    const projetsSpy = jasmine.createSpyObj('ProjetsService', ['getAll']);
    const regionsSpy = jasmine.createSpyObj('RegionsService', ['getAll', 'getActifs']);
    apiSpy.get.and.returnValue(of([]));
    authSpy.hasRole.and.returnValue(true);
    cartographieSpy.getAll.and.returnValue(of([]));
    ciblesSpy.getAll.and.returnValue(of([]));
    dashboardSpy.getCarteRegions.and.returnValue(of({ type: 'FeatureCollection', features: [] } as any));
    dashboardSpy.getCarteProvinces.and.returnValue(of({ type: 'FeatureCollection', features: [] } as any));
    dashboardSpy.getCarteCommunes.and.returnValue(of({ type: 'FeatureCollection', features: [] } as any));
    ideesSpy.getAll.and.returnValue(of([]));
    localitesInterventionSpy.getByIdeeProjet.and.returnValue(of([]));
    ministereSpy.getAll.and.returnValue(of([]));
    projetsSpy.getAll.and.returnValue(of([]));
    regionsSpy.getActifs.and.returnValue(of([]));
    regionsSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: CartographieService, useValue: cartographieSpy },
        { provide: CiblesService, useValue: ciblesSpy },
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: IdeesProjetService, useValue: ideesSpy },
        { provide: LocalitesInterventionService, useValue: localitesInterventionSpy },
        { provide: MinisteresService, useValue: ministereSpy },
        { provide: ProjetsService, useValue: projetsSpy },
        { provide: RegionsService, useValue: regionsSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    cartographieService = TestBed.inject(CartographieService) as jasmine.SpyObj<CartographieService>;
    regionsService = TestBed.inject(RegionsService) as jasmine.SpyObj<RegionsService>;
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose admin tabs for admin role', () => {
    authService.hasRole.and.returnValue(true);

    expect(component.showAdminStatisticTabs()).toBeTrue();
    component.setTab('localites');
    expect(component.isLocalitesTabActive()).toBeTrue();
  });

  it('should load dashboard stats', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/dashboard')) return of(mockStats);
      return of([]);
    });

    component.loadStats();

    expect(apiService.get).toHaveBeenCalledWith('/dashboard/statistiques');
    expect(component.stats().totalIdees).toBe(120);
    expect(component.stats().totalProjets).toBe(45);
    expect(component.stats().tauxTransformationIdeesEnProjets).toBe(37.5);
  });

  it('should load recent projects', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/projet')) return of(mockProjets);
      return of([]);
    });

    component.loadProjets();

    expect(apiService.get).toHaveBeenCalledWith('/projet?size=5');
    expect(component.projets().length).toBe(2);
  });

  it('should handle paginated project response', () => {
    apiService.get.and.returnValue(of({ content: mockProjets }));

    component.loadProjets();

    expect(component.projets().length).toBe(2);
  });

  it('should expose chart data from stats', () => {
    component.stats.set(mockStats as any);

    expect(component.projetsParPipChart()[0].label).toBe('2025');
    expect(component.montantParSecteurChart()[0].label).toBe('Infrastructures');
  });

  it('should load localite statistics', () => {
    cartographieService.getAll.and.returnValue(of(mockLocalites as any));

    component.loadLocalites();

    expect(cartographieService.getAll).toHaveBeenCalled();
    expect(component.totalLocalites()).toBe(2);
    expect(component.localitesDistinctRegions()).toBe(1);
  });

  it('should load active regions first', () => {
    regionsService.getActifs.and.returnValue(of([{ id: 'R1', code: '01', nom: 'Centre', geom: '{}', centroid: '{}' }] as any));

    component.loadRegions();

    expect(regionsService.getActifs).toHaveBeenCalled();
    expect(component.regions().length).toBe(1);
  });

  it('should format values', () => {
    expect(component.formatBudget(undefined)).toBe('0 FCFA');
    expect(component.formatPercent(37.5)).toBe('37.50%');
    expect(component.formatCompactNumber(1200)).toBeTruthy();
  });

  it('should handle stats API error with empty data', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadStats();

    expect(component.stats().totalProjets).toBe(0);
    expect(component.stats().projetsParPipAnnuel.length).toBe(0);
  });
});
