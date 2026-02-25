import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActualitesService } from '@core/services/actualites.service';
import { ApiService } from '@core/services/api.service';
import { Actualite } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-gestion-actualites',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './gestion-actualites.component.html',
  styleUrl: './gestion-actualites.component.scss'
})
export class GestionActualitesComponent implements OnInit {
  private actualitesService = inject(ActualitesService);
  private apiService = inject(ApiService);

  items = signal<Actualite[]>([]);
  filteredItems = signal<Actualite[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Actualite | null>(null);
  saving = signal(false);
  uploading = signal(false);
  formData: Partial<Actualite> = this.resetForm();

  categories = ['Programme', 'Infrastructure', 'Financement', 'Événement', 'Autre'];

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Actualite | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
  }

  private resetForm(): Partial<Actualite> {
    return { titre: '', description: '', contenu: '', imageUrl: '', documentUrl: '', categorie: 'Programme', auteur: '', publie: true, ordre: 0 };
  }

  load(): void {
    this.actualitesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des actualités', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) ||
      i.categorie?.toLowerCase().includes(term) ||
      i.auteur?.toLowerCase().includes(term) ||
      i.description?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Actualite): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.titre) {
      this.showToast('Le titre est obligatoire', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.actualitesService.update(this.editingItem()!.id, this.formData)
      : this.actualitesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Actualité modifiée avec succès' : 'Actualité créée avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: Actualite): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer l\'actualité';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer l'actualité "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.actualitesService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Actualité supprimée avec succès', 'success'); },
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

  onFileSelected(event: Event, field: 'imageUrl' | 'documentUrl'): void {
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
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
