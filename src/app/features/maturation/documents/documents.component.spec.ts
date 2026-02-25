import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DocumentsComponent } from './documents.component';

describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    spyOn(component, 'load');
    component.ngOnInit();
    expect(component.load).toHaveBeenCalled();
  });

  it('should filter items on search', () => {
    component.items.set([
      { id: 1, titre: '\u00c9tude de faisabilit\u00e9', typeDocument: '\u00c9tude', fichierUrl: '/f1', dateUpload: new Date() },
      { id: 2, titre: 'Rapport final', typeDocument: 'Rapport', fichierUrl: '/f2', dateUpload: new Date() }
    ] as any[]);
    component.searchTerm = 'faisabilit';
    component.search();
    expect(component.filteredItems().length).toBe(1);
  });

  it('should open modal for new item', () => {
    component.openModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toBeNull();
  });

  it('should open modal for editing', () => {
    const item = { id: 1, titre: 'Test', typeDocument: 'Rapport', fichierUrl: '/f', dateUpload: new Date() } as any;
    component.edit(item);
    expect(component.modalOpen()).toBeTrue();
    expect(component.editingItem()).toEqual(item);
  });

  it('should close modal', () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBeFalse();
  });

  it('should format file size', () => {
    expect(component.formatFileSize(2097152)).toContain('Mo');
    expect(component.formatFileSize(2048)).toContain('Ko');
    expect(component.formatFileSize(undefined)).toBe('-');
  });

  it('should format date', () => {
    expect(component.formatDate(new Date('2024-01-15'))).toBeTruthy();
    expect(component.formatDate(undefined)).toBe('-');
  });
});
