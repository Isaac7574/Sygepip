import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ÉvaluationsComponent } from './evaluations.component';

describe('ÉvaluationsComponent', () => {
  let component: ÉvaluationsComponent;
  let fixture: ComponentFixture<ÉvaluationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ÉvaluationsComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(ÉvaluationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should get type label', () => { expect(component.getTypeLabel('FINALE')).toBe('Finale'); });
  it('should get type badge class', () => { expect(component.getTypeBadgeClass('MI_PARCOURS')).toBe('badge-info'); });
  it('should format date', () => { expect(component.formatDate(undefined)).toBe('-'); });
});
