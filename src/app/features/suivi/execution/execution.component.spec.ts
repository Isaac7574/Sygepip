import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SuiviExecutionComponent } from './execution.component';

describe('SuiviExecutionComponent', () => {
  let component: SuiviExecutionComponent;
  let fixture: ComponentFixture<SuiviExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SuiviExecutionComponent, HttpClientTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(SuiviExecutionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load on init', () => { spyOn(component, 'load'); component.ngOnInit(); expect(component.load).toHaveBeenCalled(); });
  it('should open modal', () => { component.openModal(); expect(component.modalOpen()).toBeTrue(); });
  it('should close modal', () => { component.modalOpen.set(true); component.closeModal(); expect(component.modalOpen()).toBeFalse(); });
});
