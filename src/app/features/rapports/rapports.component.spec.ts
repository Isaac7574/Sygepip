import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RapportsComponent } from './rapports.component';

describe('RapportsComponent', () => {
  let component: RapportsComponent;
  let fixture: ComponentFixture<RapportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RapportsComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(RapportsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should get statut label', () => { expect(component.getStatutLabel('CONFORME')).toBe('Conforme'); });
  it('should get statut badge class', () => { expect(component.getStatutBadgeClass('CRITIQUE')).toBe('badge-danger'); });
});
