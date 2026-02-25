import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertesComponent } from './alertes.component';

describe('AlertesComponent', () => {
  let component: AlertesComponent;
  let fixture: ComponentFixture<AlertesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlertesComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(AlertesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should get niveau label', () => { expect(component.getNiveauLabel('CRITICAL')).toBe('Critique'); });
  it('should get niveau badge class', () => { expect(component.getNiveauBadgeClass('CRITICAL')).toBe('badge-danger'); });
  it('should format date', () => { expect(component.formatDate(undefined)).toBe('-'); });
});
