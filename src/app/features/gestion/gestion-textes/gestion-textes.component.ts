import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextesReglementairesService } from '@core/services/textes-reglementaires.service';
import { ApiService } from '@core/services/api.service';
import { TexteReglementaire } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-gestion-textes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './gestion-textes.component.html',
  styleUrl: './gestion-textes.component.scss'
})
export class GestionTextesComponent implements OnInit {
  private textesService = inject(TextesReglementairesService);
  private apiService = inject(ApiService);

  items = signal<TexteReglementaire[]>([]);
  filteredItems = signal<TexteReglementaire[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<TexteReglementaire | null>(null);
  saving = signal(false);
  uploading = signal(false);
  formData: Partial<TexteReglementaire> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: TexteReglementaire | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  types = [
    { value: 'LOI', label: 'Loi' },
    { value: 'DECRET', label: 'Décret' },
    { value: 'ARRETE', label: 'Arrêté' },
    { value: 'CIRCULAIRE', label: 'Circulaire' },
    { value: 'NOTE', label: 'Note' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.load();
  }

  private resetForm(): Partial<TexteReglementaire> {
    return { type: 'LOI', numero: '', titre: '', description: '', fichierUrl: '', categorie: '', motsCles: '', actif: true };
  }

  load(): void {
    this.textesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des textes réglementaires', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) || i.numero?.toLowerCase().includes(term) || i.description?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: TexteReglementaire): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.titre?.trim() || !this.formData.numero?.trim()) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.textesService.update(this.editingItem()!.id, this.formData)
      : this.textesService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Texte réglementaire modifié avec succès' : 'Texte réglementaire créé avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: TexteReglementaire): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le texte réglementaire';
    this.confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer ce texte réglementaire ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.textesService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Texte réglementaire supprimé avec succès', 'success'); },
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

  getTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    const found = this.types.find(t => t.value === type);
    return found ? found.label : type;
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
