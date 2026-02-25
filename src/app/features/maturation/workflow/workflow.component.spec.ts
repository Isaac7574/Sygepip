import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkflowComponent } from './workflow.component';

describe('WorkflowComponent', () => {
  let component: WorkflowComponent;
  let fixture: ComponentFixture<WorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowComponent);
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
      { id: 1, module: 'MATURATION', codeEtape: 'MAT-01', nomEtape: 'Soumission', ordre: 1, actif: true },
      { id: 2, module: 'PIP', codeEtape: 'PIP-01', nomEtape: 'Validation', ordre: 1, actif: true }
    ] as any[]);
    component.searchTerm = 'Soumission';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, module: 'MATURATION', codeEtape: 'MAT-01', nomEtape: 'Test', ordre: 1, actif: true } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should get module badge class', () => {
    expect(component.getModuleBadgeClass('MATURATION')).toBe('badge-info');
    expect(component.getModuleBadgeClass('PIP')).toBe('badge-warning');
    expect(component.getModuleBadgeClass('SUIVI')).toBe('badge-success');
  });
});
