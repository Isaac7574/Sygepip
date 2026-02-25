import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ArbitrageComponent } from './arbitrage.component';

describe('ArbitrageComponent', () => {
  let component: ArbitrageComponent;
  let fixture: ComponentFixture<ArbitrageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArbitrageComponent, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(ArbitrageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load data on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal for new item', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); expect(component.editingItem()).toBeNull(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should get statut badge class', () => { expect(component.getStatutBadgeClass('AUTORISE')).toBe('badge-info'); expect(component.getStatutBadgeClass('ENGAGE')).toBe('badge-success'); });
});
