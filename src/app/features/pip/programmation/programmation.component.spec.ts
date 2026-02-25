import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProgrammationComponent } from './programmation.component';

describe('ProgrammationComponent', () => {
  let component: ProgrammationComponent;
  let fixture: ComponentFixture<ProgrammationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgrammationComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgrammationComponent);
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
      { id: 1, code: 'PIP-2024', annee: 2024, statut: 'EXECUTION', actif: true },
      { id: 2, code: 'PIP-2023', annee: 2023, statut: 'CLOTURE', actif: true }
    ] as any[]);
    component.searchTerm = '2024';
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
    expect(component.getStatutBadgeClass('EXECUTION')).toBe('badge-warning');
    expect(component.getStatutBadgeClass('CLOTURE')).toBe('badge-success');
  });
});
