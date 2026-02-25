import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CartographieComponent } from './cartographie.component';

describe('CartographieComponent', () => {
  let component: CartographieComponent;
  let fixture: ComponentFixture<CartographieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartographieComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(CartographieComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should format coordinates', () => { expect(component.formatCoord(12.37)).toBe('12.370000'); expect(component.formatCoord(undefined)).toBe('-'); });
});
