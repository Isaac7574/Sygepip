import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ActualitesComponent } from './actualites.component';

describe('ActualitesComponent', () => {
  let component: ActualitesComponent;
  let fixture: ComponentFixture<ActualitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualitesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActualitesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by category', () => {
    component.filterByCategory('Programme');
    expect(component.selectedCategory()).toBe('Programme');
  });

  it('should reset filter when empty category', () => {
    component.filterByCategory('Programme');
    component.filterByCategory('');
    expect(component.selectedCategory()).toBe('');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('janvier');
    expect(formatted).toContain('2024');
  });

  it('should handle empty date', () => {
    const formatted = component.formatDate(undefined);
    expect(formatted).toBe('');
  });
});
