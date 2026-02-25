import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService } from '@core/services/documents.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { ApiService } from '@core/services/api.service';
import { DocumentProjet, IdeeProjet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit {
  private documentsService = inject(DocumentsService);
  private ideesProjetService = inject(IdeesProjetService);
  private apiService = inject(ApiService);

  items = signal<DocumentProjet[]>([]);
  filteredItems = signal<DocumentProjet[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<DocumentProjet | null>(null);
  saving = signal(false);
  uploading = signal(false);
  formData: Partial<DocumentProjet> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: DocumentProjet | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesDocument = [
    'Étude de faisabilité',
    'Rapport technique',
    'Plan de financement',
    'Cahier des charges',
    'Rapport d\'avancement',
    'PV de réception',
    'Autre'
  ];

  ngOnInit(): void {
    this.load();
    this.loadIdeesProjet();
  }

  private resetForm(): Partial<DocumentProjet> {
    return { titre: '', typeDocument: '', description: '', fichierUrl: '', ideeProjetId: undefined };
  }

  load(): void {
    this.documentsService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des documents', 'error')
    });
  }

  loadIdeesProjet(): void {
    this.ideesProjetService.getAll().subscribe({
      next: (data) => this.ideesProjet.set(data),
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) || i.typeDocument?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: DocumentProjet): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.titre?.trim() || !this.formData.typeDocument) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.documentsService.update(this.editingItem()!.id, this.formData)
      : this.documentsService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Document modifié avec succès' : 'Document créé avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: DocumentProjet): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le document';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer ce document ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.documentsService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Document supprimé avec succès', 'success'); },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
    }
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }

  getIdeeProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? (ip.code + ' - ' + ip.titre) : '-';
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' Mo';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return bytes + ' o';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploading.set(true);
    this.apiService.upload('/upload', file).subscribe({
      next: (res: any) => {
        this.formData.fichierUrl = res.url || res.fileName || res;
        this.uploading.set(false);
        this.showToast('Fichier uploadé avec succès', 'success');
      },
      error: () => {
        this.uploading.set(false);
        this.showToast('Erreur lors de l\'upload du fichier', 'error');
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
