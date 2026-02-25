import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SecteursComponent } from './secteurs.component';

describe('SecteursComponent', () => {
  let component: SecteursComponent;
  let fixture: ComponentFixture<SecteursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecteursComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SecteursComponent);
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
      { id: 1, code: 'SEC-01', nom: 'Agriculture', actif: true },
      { id: 2, code: 'SEC-02', nom: 'Éducation', actif: true }
    ] as any[]);
    component.searchTerm = 'Agri';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, code: 'SEC-01', nom: 'Test', actif: true } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });
});
