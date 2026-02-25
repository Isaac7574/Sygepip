import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '@core/services/api.service';
import { of, throwError } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockStats = {
    totalProjets: 245,
    projetsEnCours: 120,
    budgetTotal: 1500000000000,
    tauxExecutionGlobal: 65,
    alertesActives: 12
  };

  const mockProjets = [
    { id: 1, intitule: 'Projet A', code: 'PRJ-001', coutTotal: 5000000000, statut: 'EN_COURS', tauxExecution: 45, ministere: { sigle: 'MEFP' } },
    { id: 2, intitule: 'Projet B', code: 'PRJ-002', coutTotal: 3000000000, statut: 'TERMINE', tauxExecution: 100, ministere: { sigle: 'MINEFID' } },
    { id: 3, intitule: 'Projet C', code: 'PRJ-003', coutTotal: 1500000, statut: 'PLANIFIE', tauxExecution: 0, ministere: { sigle: 'MENAPLN' } }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    apiSpy.get.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statistics on init', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/dashboard')) return of(mockStats);
      return of([]);
    });

    component.loadStats();

    expect(apiService.get).toHaveBeenCalledWith('/dashboard/statistiques');
    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.totalProjets).toBe(245);
    expect(component.stats()?.projetsEnCours).toBe(120);
    expect(component.stats()?.budgetTotal).toBe(1500000000000);
    expect(component.stats()?.tauxExecutionGlobal).toBe(65);
    expect(component.stats()?.alertesActives).toBe(12);
  });

  it('should load recent projects', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/projet')) return of(mockProjets);
      return of([]);
    });

    component.loadProjets();

    expect(apiService.get).toHaveBeenCalledWith('/projet?size=5');
    expect(component.projets().length).toBe(3);
    expect(component.projets()[0].intitule).toBe('Projet A');
    expect(component.projets()[1].intitule).toBe('Projet B');
  });

  it('should handle paginated project response', () => {
    const paginatedResponse = { content: mockProjets, totalElements: 10, totalPages: 2 };
    apiService.get.and.returnValue(of(paginatedResponse));

    component.loadProjets();

    expect(component.projets().length).toBe(3);
  });

  it('should display stat cards', () => {
    component.stats.set(mockStats);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statCards = compiled.querySelectorAll('.card');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('should format numbers', () => {
    expect(component.formatBudget(undefined)).toBe('0 FCFA');
    expect(component.formatBudget(0)).toBe('0 FCFA');
    expect(component.formatBudget(1500000000000)).toBe('1.5 T');
    expect(component.formatBudget(2500000000)).toBe('2.5 Mds');
    expect(component.formatBudget(3500000)).toBe('3.5 M');
    expect(component.formatBudget(500000)).toContain('FCFA');
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('EN_COURS')).toBe('badge-warning');
    expect(component.getStatusClass('TERMINE')).toBe('badge-success');
    expect(component.getStatusClass('SUSPENDU')).toBe('badge-danger');
    expect(component.getStatusClass('PLANIFIE')).toBe('badge-info');
    expect(component.getStatusClass('UNKNOWN')).toBe('badge-secondary');
  });

  it('should handle stats API error with fallback data', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadStats();

    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.totalProjets).toBe(245);
  });

  it('should handle projets API error with empty array', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadProjets();

    expect(component.projets().length).toBe(0);
  });
});
