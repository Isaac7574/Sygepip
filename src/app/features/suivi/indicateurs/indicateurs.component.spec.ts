import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IndicateursComponent } from './indicateurs.component';

describe('IndicateursComponent', () => {
  let component: IndicateursComponent;
  let fixture: ComponentFixture<IndicateursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [IndicateursComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(IndicateursComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
  it('should calculate progress', () => { expect(component.getProgress({ valeurCible: 100, valeurActuelle: 75 } as any)).toBe(75); });
});
