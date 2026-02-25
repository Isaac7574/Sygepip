import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediasService } from '@core/services/medias.service';
import { ApiService } from '@core/services/api.service';
import { Media } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-gestion-medias',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './gestion-medias.component.html',
  styleUrl: './gestion-medias.component.scss'
})
export class GestionMediasComponent implements OnInit {
  private mediasService = inject(MediasService);
  private apiService = inject(ApiService);

  items = signal<Media[]>([]);
  filteredItems = signal<Media[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Media | null>(null);
  saving = signal(false);
  uploading = signal(false);
  formData: Partial<Media> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Media | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  types = [
    { value: 'IMAGE', label: 'Image' },
    { value: 'VIDEO', label: 'Vidéo' },
    { value: 'AUDIO', label: 'Audio' },
    { value: 'DOCUMENT', label: 'Document' }
  ];

  ngOnInit(): void {
    this.load();
  }

  private resetForm(): Partial<Media> {
    return { type: 'IMAGE', titre: '', description: '', url: '', thumbnailUrl: '', categorie: '', tags: '', actif: true };
  }

  load(): void {
    this.mediasService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) || i.categorie?.toLowerCase().includes(term) || i.tags?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Media): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.titre || !this.formData.url) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.mediasService.update(this.editingItem()!.id, this.formData)
      : this.mediasService.create(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Média modifié avec succès' : 'Média créé avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: Media): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le média';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer ce média ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.mediasService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Média supprimé avec succès', 'success'); },
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

  getTypeLabel(value: string): string {
    return this.types.find(t => t.value === value)?.label || value;
  }

  onFileSelected(event: Event, field: 'url' | 'thumbnailUrl'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploading.set(true);
    this.apiService.upload('/upload', file).subscribe({
      next: (res: any) => {
        this.formData[field] = res.url || res.fileName || res;
        this.uploading.set(false);
        this.showToast('Fichier uploadé avec succès', 'success');
      },
      error: () => {
        this.uploading.set(false);
        this.showToast('Erreur lors de l\'upload du fichier', 'error');
      }
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
