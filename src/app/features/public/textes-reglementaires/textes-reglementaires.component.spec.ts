import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { TextesReglementairesComponent } from './textes-reglementaires.component';

describe('TextesReglementairesComponent', () => {
  let component: TextesReglementairesComponent;
  let fixture: ComponentFixture<TextesReglementairesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextesReglementairesComponent, FormsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TextesReglementairesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by type', () => {
    component.filterByType('Loi');
    expect(component.selectedType()).toBe('Loi');
  });

  it('should reset filter when empty type', () => {
    component.filterByType('Loi');
    component.filterByType('');
    expect(component.selectedType()).toBe('');
  });

  it('should close modal', () => {
    component.closeModal();
    expect(component.selectedTexte()).toBeNull();
  });

  it('should return correct type color class', () => {
    expect(component.getTypeColorClass('Loi')).toContain('blue');
    expect(component.getTypeColorClass('Décret')).toContain('purple');
    expect(component.getTypeColorClass('Arrêté')).toContain('green');
    expect(component.getTypeColorClass('Circulaire')).toContain('orange');
  });

  it('should return correct statut badge class', () => {
    expect(component.getStatutBadgeClass('En vigueur')).toContain('green');
    expect(component.getStatutBadgeClass('Abrogé')).toContain('red');
    expect(component.getStatutBadgeClass('Modifié')).toContain('yellow');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('janvier');
    expect(formatted).toContain('2024');
  });
});
