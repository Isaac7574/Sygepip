import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MediathequeComponent } from './mediatheque.component';

describe('MediathequeComponent', () => {
  let component: MediathequeComponent;
  let fixture: ComponentFixture<MediathequeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediathequeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MediathequeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by type', () => {
    component.filterByType('video');
    expect(component.selectedType()).toBe('video');
  });

  it('should reset filter to all', () => {
    component.filterByType('video');
    component.filterByType('all');
    expect(component.selectedType()).toBe('all');
  });

  it('should return correct type label', () => {
    expect(component.getTypeLabel('video')).toBe('Vidéo');
    expect(component.getTypeLabel('image')).toBe('Photo');
    expect(component.getTypeLabel('document')).toBe('Document');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('janvier');
    expect(formatted).toContain('2024');
  });

  it('should close modal', () => {
    component.closeModal();
    expect(component.selectedMedia()).toBeNull();
  });
});
