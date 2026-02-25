import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RegionsComponent } from './regions.component';

describe('RegionsComponent', () => {
  let component: RegionsComponent;
  let fixture: ComponentFixture<RegionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionsComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RegionsComponent);
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
      { id: 1, code: 'REG-01', nom: 'Boucle du Mouhoun', actif: true },
      { id: 2, code: 'REG-02', nom: 'Cascades', actif: true }
    ] as any[]);
    component.searchTerm = 'Boucle';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, code: 'REG-01', nom: 'Test', actif: true } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should format numbers', () => {
    expect(component.formatNumber(1000000)).toBeTruthy();
    expect(component.formatNumber(undefined)).toBe('-');
  });
});
