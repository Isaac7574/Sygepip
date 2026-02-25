import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccueilComponent } from './accueil.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('AccueilComponent', () => {
  let component: AccueilComponent;
  let fixture: ComponentFixture<AccueilComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockActualites = [
    { id: 1, titre: 'Actualité 1', description: 'Description 1', imageUrl: '', categorie: 'Programme', datePublication: new Date(), publie: true },
    { id: 2, titre: 'Actualité 2', description: 'Description 2', imageUrl: '', categorie: 'Infrastructure', datePublication: new Date(), publie: true },
    { id: 3, titre: 'Actualité 3', description: 'Description 3', imageUrl: '', categorie: 'Financement', datePublication: new Date(), publie: true }
  ];

  const mockMinistre = {
    id: 1, nom: 'COULIBALY', prenom: 'Aboubakar', fonction: 'Ministre de l\'Économie',
    biographie: 'Biographie du ministre...', actif: true
  };

  const mockStats = {
    totalProjets: 245, projetsEnCours: 120, projetsTermines: 85,
    budgetTotal: 1500000000000, budgetExecute: 750000000000,
    tauxExecutionGlobal: 65, alertesActives: 12, ideesProjetsEnAttente: 45
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout', 'currentUser']);

    apiSpy.get.and.returnValue(of([]));
    authSpy.isAuthenticated.and.returnValue(false);
    authSpy.currentUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [AccueilComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(AccueilComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load actualites on init', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/actualite')) return of(mockActualites);
      return of([]);
    });

    component.loadActualites();

    expect(apiService.get).toHaveBeenCalledWith('/actualite?publie=true&size=5');
    expect(component.actualites().length).toBe(3);
    expect(component.actualites()[0].titre).toBe('Actualité 1');
  });

  it('should load ministre on init', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/ministre')) return of([mockMinistre]);
      return of([]);
    });

    component.loadMinistre();

    expect(apiService.get).toHaveBeenCalledWith('/ministre?actif=true');
    expect(component.ministre()).toBeTruthy();
    expect(component.ministre()?.nom).toBe('COULIBALY');
  });

  it('should load stats on init', () => {
    apiService.get.and.callFake((url: string): any => {
      if (url.includes('/dashboard')) return of(mockStats);
      return of([]);
    });

    component.loadStats();

    expect(apiService.get).toHaveBeenCalledWith('/dashboard/statistiques');
    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.totalProjets).toBe(245);
  });

  it('should navigate slides', () => {
    component.actualites.set(mockActualites);
    component.currentSlide.set(0);

    component.nextSlide();
    expect(component.currentSlide()).toBe(1);

    component.nextSlide();
    expect(component.currentSlide()).toBe(2);

    component.nextSlide();
    expect(component.currentSlide()).toBe(0);

    component.prevSlide();
    expect(component.currentSlide()).toBe(2);

    component.goToSlide(1);
    expect(component.currentSlide()).toBe(1);
  });

  it('should format budget correctly', () => {
    expect(component.formatBudget(undefined)).toBe('0 FCFA');
    expect(component.formatBudget(0)).toBe('0 FCFA');
    expect(component.formatBudget(1500000000000)).toBe('1.5 T FCFA');
    expect(component.formatBudget(2500000000)).toBe('2.5 Mds FCFA');
    expect(component.formatBudget(3500000)).toBe('3.5 M FCFA');
    expect(component.formatBudget(500000)).toContain('FCFA');
  });

  it('should handle logout', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should use fallback data when actualites API fails', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadActualites();

    expect(component.actualites().length).toBe(3);
    expect(component.actualites()[0].titre).toContain('Programme National');
  });

  it('should use fallback data when ministre API fails', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadMinistre();

    expect(component.ministre()).toBeTruthy();
    expect(component.ministre()?.nom).toBe('COULIBALY');
  });

  it('should use fallback data when stats API fails', () => {
    apiService.get.and.returnValue(throwError(() => new Error('API error')));

    component.loadStats();

    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.totalProjets).toBe(245);
  });

  it('should stop slideshow on destroy', fakeAsync(() => {
    component.startSlideshow();
    expect(component['slideInterval']).toBeTruthy();

    component.ngOnDestroy();
    // After destroy, interval should be cleared
    tick(7000);
    // No error should occur
  }));
});
