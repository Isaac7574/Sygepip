import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MinistresService } from '@core/services/ministres.service';
import { ApiService } from '@core/services/api.service';
import { Ministre } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-gestion-ministre',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './gestion-ministre.component.html',
  styleUrl: './gestion-ministre.component.scss'
})
export class GestionMinistreComponent implements OnInit {
  private ministresService = inject(MinistresService);
  private apiService = inject(ApiService);

  items = signal<Ministre[]>([]);
  filteredItems = signal<Ministre[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Ministre | null>(null);
  saving = signal(false);
  uploading = signal(false);
  formData: Partial<Ministre> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Ministre | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
  }

  private resetForm(): Partial<Ministre> {
    return { nom: '', prenom: '', photoUrl: '', fonction: '', biographie: '', email: '', telephone: '', actif: true };
  }

  load(): void {
    this.ministresService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) ||
      i.prenom?.toLowerCase().includes(term) ||
      i.fonction?.toLowerCase().includes(term) ||
      i.email?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Ministre): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.nom || !this.formData.prenom || !this.formData.fonction) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.ministresService.update(this.editingItem()!.id, this.formData)
      : this.ministresService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Ministre modifié avec succès' : 'Ministre créé avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: Ministre): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le ministre';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer ${item.prenom} ${item.nom} ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.ministresService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Ministre supprimé avec succès', 'success'); },
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

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploading.set(true);
    this.apiService.upload('/upload', file).subscribe({
      next: (res: any) => {
        this.formData.photoUrl = res.url || res.fileName || res;
        this.uploading.set(false);
        this.showToast('Photo uploadée avec succès', 'success');
      },
      error: () => {
        this.uploading.set(false);
        this.showToast('Erreur lors de l\'upload de la photo', 'error');
      }
    });
  }
}
