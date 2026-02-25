import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnveloppesComponent } from './enveloppes.component';

describe('EnveloppesComponent', () => {
  let component: EnveloppesComponent;
  let fixture: ComponentFixture<EnveloppesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnveloppesComponent, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(EnveloppesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load data on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal for new item', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); expect(component.editingItem()).toBeNull(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should format montant', () => { expect(component.formatMontant(5000000000)).toContain('Mds'); expect(component.formatMontant(undefined)).toBe('-'); });
});
