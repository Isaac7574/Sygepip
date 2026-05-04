import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ArbitrageComponent } from './arbitrage.component';
import { ProjetsService } from '@core/services/projets.service';

describe('ArbitrageComponent', () => {
  let component: ArbitrageComponent;
  let fixture: ComponentFixture<ArbitrageComponent>;
  let projetsService: jasmine.SpyObj<ProjetsService>;

  beforeEach(async () => {
    projetsService = jasmine.createSpyObj('ProjetsService', ['getAll']);
    projetsService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ArbitrageComponent, HttpClientTestingModule],
      providers: [
        { provide: ProjetsService, useValue: projetsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArbitrageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load only projects with EN_ARBITRAGE status', () => {
    projetsService.getAll.and.returnValue(of([
      { id: '1', code: 'P1', titre: 'Projet 1', statut: 'EN_ARBITRAGE', ministereId: 'm1', actif: true },
      { id: '2', code: 'P2', titre: 'Projet 2', statut: 'PIP_FINANCIER_CREE', ministereId: 'm1', actif: true }
    ] as any));

    component.loadProjets();

    expect(component.projets().length).toBe(1);
    expect(component.projets()[0].statut).toBe('EN_ARBITRAGE');
  });

  it('should normalize status before filtering', () => {
    projetsService.getAll.and.returnValue(of([
      { id: '1', code: 'P1', titre: 'Projet 1', statut: ' en_arbitrage ', ministereId: 'm1', actif: true }
    ] as any));

    component.loadProjets();

    expect(component.projets().length).toBe(1);
  });

  it('should open modal for selected project', () => {
    const projet = { id: '1', code: 'P1', titre: 'Projet 1', statut: 'EN_ARBITRAGE', ministereId: 'm1', actif: true } as any;

    component.openModal(projet);

    expect(component.modalOpen()).toBeTrue();
    expect(component.selectedProjet()?.id).toBe('1');
  });

  it('should clear amount CP when CP selection changes', () => {
    component.formData.montantCp = 100;

    component.onCreditPaiementChange();

    expect(component.formData.montantCp).toBeUndefined();
  });
});
