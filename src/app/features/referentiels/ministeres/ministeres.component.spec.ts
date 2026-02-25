import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MinisteresComponent } from './ministeres.component';
import { ApiService } from '@core/services/api.service';
import { of, throwError } from 'rxjs';

describe('MinisteresComponent', () => {
  let component: MinisteresComponent;
  let fixture: ComponentFixture<MinisteresComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockMinisteres: any[] = [
    { id: 1, sigle: 'MEFP', nom: 'Ministère de l\'Économie, des Finances et de la Prospective', code: 'MEFP-001', actif: true, dateCreation: new Date() },
    { id: 2, sigle: 'MINEFID', nom: 'Ministère de l\'Éducation Nationale', code: 'MINED-001', actif: true, dateCreation: new Date() },
    { id: 3, sigle: 'MSAS', nom: 'Ministère de la Santé et de l\'Action Sociale', code: 'MSAS-001', actif: false, dateCreation: new Date() }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    apiSpy.get.and.returnValue(of(mockMinisteres));
    apiSpy.post.and.returnValue(of({}));
    apiSpy.put.and.returnValue(of({}));
    apiSpy.delete.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [MinisteresComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    fixture = TestBed.createComponent(MinisteresComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load ministeres on init', () => {
    component.ngOnInit();

    expect(apiService.get).toHaveBeenCalledWith('/ministere', undefined);
    expect(component.items().length).toBe(3);
    expect(component.filteredItems().length).toBe(3);
    expect(component.items()[0].sigle).toBe('MEFP');
  });

  it('should filter ministeres by search', () => {
    component.items.set(mockMinisteres);
    component.filteredItems.set(mockMinisteres);

    component.searchTerm = 'MEFP';
    component.search();
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].sigle).toBe('MEFP');

    component.searchTerm = 'Santé';
    component.search();
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].sigle).toBe('MSAS');

    component.searchTerm = '';
    component.search();
    expect(component.filteredItems().length).toBe(3);
  });

  it('should open modal for create', () => {
    component.openModal();

    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
    expect(component.formData.sigle).toBe('');
    expect(component.formData.nom).toBe('');
    expect(component.formData.actif).toBeTrue();
  });

  it('should open modal for edit', () => {
    const item = mockMinisteres[0];
    component.edit(item as any);

    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeTruthy();
    expect(component.formData.sigle).toBe('MEFP');
    expect(component.formData.nom).toBe(item.nom);
  });

  it('should delete ministere', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.confirmDelete(mockMinisteres[0] as any);

    expect(apiService.delete).toHaveBeenCalledWith('/ministere', 1);
  });

  it('should not delete when user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.confirmDelete(mockMinisteres[0] as any);

    expect(apiService.delete).not.toHaveBeenCalled();
  });

  it('should toggle modal', () => {
    expect(component.modalOpen()).toBeFalse();

    component.openModal();
    expect(component.modalOpen()).toBeTrue();

    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should save new ministere', () => {
    component.openModal();
    component.formData = { sigle: 'NEW', nom: 'Nouveau Ministère', code: 'NEW-001', actif: true };

    component.save();

    expect(apiService.post).toHaveBeenCalledWith('/ministere', component.formData);
  });

  it('should update existing ministere', () => {
    const item = mockMinisteres[0];
    component.edit(item as any);
    component.formData.nom = 'Updated Name';

    component.save();

    expect(apiService.put).toHaveBeenCalledWith('/ministere', 1, component.formData);
  });

  it('should set saving flag during save', () => {
    component.openModal();
    component.formData = { sigle: 'NEW', nom: 'Test', code: 'T-001', actif: true };

    expect(component.saving()).toBeFalse();
    component.save();
    // After successful save, saving should be reset
    expect(component.saving()).toBeFalse();
  });

  it('should handle search case-insensitively', () => {
    component.items.set(mockMinisteres);
    component.filteredItems.set(mockMinisteres);

    component.searchTerm = 'mefp';
    component.search();
    expect(component.filteredItems().length).toBe(1);

    component.searchTerm = 'MEFP';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });
});
