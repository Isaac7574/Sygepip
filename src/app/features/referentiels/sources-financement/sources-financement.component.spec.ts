import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SourcesdeFinancementComponent } from './sources-financement.component';

describe('SourcesdeFinancementComponent', () => {
  let component: SourcesdeFinancementComponent;
  let fixture: ComponentFixture<SourcesdeFinancementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcesdeFinancementComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SourcesdeFinancementComponent);
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
      { id: 1, code: 'SRC-01', nom: 'Budget National', type: 'RESSOURCE_PROPRE_ETAT', actif: true },
      { id: 2, code: 'SRC-02', nom: 'Banque Mondiale', type: 'RESSOURCE_EXTERIEURE', actif: true }
    ] as any[]);
    component.searchTerm = 'Banque';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, code: 'SRC-01', nom: 'Test', type: 'RESSOURCE_PROPRE_ETAT', actif: true } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should get type label', () => {
    expect(component.getTypeLabel('RESSOURCE_PROPRE_ETAT')).toBe('Ressource propre Etat');
    expect(component.getTypeLabel('RESSOURCE_EXTERIEURE')).toBe('Ressource extérieure');
    expect(component.getTypeLabel('CONTREPARTIE_NATIONALE')).toBe('Contrepartie nationale');
  });

  it('should get type badge class', () => {
    expect(component.getTypeBadgeClass('RESSOURCE_EXTERIEURE')).toBe('badge-info');
    expect(component.getTypeBadgeClass('CONTREPARTIE_NATIONALE')).toBe('badge-warning');
    expect(component.getTypeBadgeClass('RESSOURCE_PROPRE_ETAT')).toBe('badge-success');
  });
});
