import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IdeesdeProjetComponent } from './idees-projet.component';

describe('IdeesdeProjetComponent', () => {
  let component: IdeesdeProjetComponent;
  let fixture: ComponentFixture<IdeesdeProjetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeesdeProjetComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(IdeesdeProjetComponent);
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
      { id: 1, code: 'IP-01', titre: 'Route nationale', categorie: 'NOUVEAU', priorite: 'HAUTE', statut: 'BROUILLON' },
      { id: 2, code: 'IP-02', titre: 'École primaire', categorie: 'NOUVEAU', priorite: 'MOYENNE', statut: 'SOUMIS' }
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

  it('should open modal for editing', () => {
    const item = { id: 1, code: 'IP-01', titre: 'Test', statut: 'BROUILLON' } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should get statut badge class', () => {
    expect(component.getStatutBadgeClass('VALIDE')).toBe('badge-success');
    expect(component.getStatutBadgeClass('REJETE')).toBe('badge-danger');
    expect(component.getStatutBadgeClass('BROUILLON')).toBe('badge-secondary');
  });

  it('should format cout', () => {
    expect(component.formatCout(5000000000)).toContain('Mds');
    expect(component.formatCout(5000000)).toContain('M');
    expect(component.formatCout(undefined)).toBe('-');
  });
});
