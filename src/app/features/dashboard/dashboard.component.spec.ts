import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '@core/services/api.service';
import { MinisteresService } from '@core/services/ministeres.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

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
    montantParSecteur: [{ secteurId: '1', secteurNom: 'Infrastructures', montantTotal: 1200000000 }]
  };

  const mockProjets = [
    { id: 1, intitule: 'Projet A', code: 'PRJ-001', coutTotal: 5000000000, statut: 'EN_COURS', tauxExecution: 45, ministere: { sigle: 'MEFP' } },
    { id: 2, intitule: 'Projet B', code: 'PRJ-002', coutTotal: 3000000000, statut: 'TERMINE', tauxExecution: 100, ministere: { sigle: 'MINEFID' } }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    const ministereSpy = jasmine.createSpyObj('MinisteresService', ['getAll']);
    apiSpy.get.and.returnValue(of([]));
    ministereSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: MinisteresService, useValue: ministereSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
