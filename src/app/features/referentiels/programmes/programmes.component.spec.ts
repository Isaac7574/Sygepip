import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProgrammesComponent } from './programmes.component';

describe('ProgrammesComponent', () => {
  let component: ProgrammesComponent;
  let fixture: ComponentFixture<ProgrammesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgrammesComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgrammesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    spyOn(component, 'load');
    spyOn(component, 'loadMinisteres');
    spyOn(component, 'loadSecteurs');
    component.ngOnInit();
    expect(component.load).toHaveBeenCalled();
    expect(component.loadMinisteres).toHaveBeenCalled();
    expect(component.loadSecteurs).toHaveBeenCalled();
  });

  it('should filter items on search', () => {
    component.items.set([
      { id: 1, code: 'PRG-01', nom: 'Programme Infrastructure', ministereId: 1, actif: true },
      { id: 2, code: 'PRG-02', nom: 'Programme Éducation', ministereId: 2, actif: true }
    ] as any[]);
    component.searchTerm = 'Infrastructure';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, code: 'PRG-01', nom: 'Test', ministereId: 1, actif: true } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should format budget', () => {
    expect(component.formatBudget(1500000000)).toContain('Mds');
    expect(component.formatBudget(5000000)).toContain('M');
    expect(component.formatBudget(undefined)).toBe('-');
  });

  it('should get ministere nom', () => {
    component.ministeres.set([{ id: 1, code: 'M1', nom: 'Ministère Test', sigle: 'MT', actif: true }] as any[]);
    expect(component.getMinistereNom(1)).toBe('MT');
    expect(component.getMinistereNom(999)).toBe('-');
  });
});
