import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProjetsPIPComponent } from './projets.component';

describe('ProjetsPIPComponent', () => {
  let component: ProjetsPIPComponent;
  let fixture: ComponentFixture<ProjetsPIPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsPIPComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjetsPIPComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    spyOn(component, 'load');
    component.ngOnInit();
    expect(component.load).toHaveBeenCalled();
  });

  it('should filter items on search', () => {
    component.items.set([
      { id: 1, code: 'PRJ-01', titre: 'Route nationale', categorie: 'NOUVEAU', coutTotal: 1000000, statut: 'EN_COURS', actif: true },
      { id: 2, code: 'PRJ-02', titre: '\u00c9cole primaire', categorie: 'NOUVEAU', coutTotal: 500000, statut: 'PLANIFIE', actif: true }
    ] as any[]);
    component.searchTerm = 'Route';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should get statut badge class', () => {
    expect(component.getStatutBadgeClass('EN_COURS')).toBe('badge-warning');
    expect(component.getStatutBadgeClass('TERMINE')).toBe('badge-success');
  });

  it('should format budget', () => {
    expect(component.formatBudget(5000000000)).toContain('Mds');
    expect(component.formatBudget(undefined)).toBe('-');
  });
});
