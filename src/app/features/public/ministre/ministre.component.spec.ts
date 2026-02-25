import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { LeMinistreComponent } from './ministre.component';

describe('LeMinistreComponent', () => {
  let component: LeMinistreComponent;
  let fixture: ComponentFixture<LeMinistreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeMinistreComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeMinistreComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have experiences data', () => {
    expect(component.experiences().length).toBeGreaterThan(0);
  });

  it('should have educations data', () => {
    expect(component.educations().length).toBeGreaterThan(0);
  });

  it('should have achievements data', () => {
    expect(component.achievements().length).toBeGreaterThan(0);
  });

  it('should have current year set', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });
});
