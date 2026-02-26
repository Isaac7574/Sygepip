import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectionService } from '@core/services/direction.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { Direction, Ministere } from '@core/models';

@Component({
  selector: 'app-directions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directions.component.html',
  styleUrl: './directions.component.scss'
})
export class DirectionsComponent implements OnInit {
  private directionService = inject(DirectionService);
  private ministeresService = inject(MinisteresService);

  items = signal<Direction[]>([]);
  filteredItems = signal<Direction[]>([]);
  ministeres = signal<Ministere[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Direction | null>(null);
  saving = signal(false);
  formData: Partial<Direction> = { code: '', nom: '', ministereId: '', actif: true };

  // Toast state
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.load();
    this.loadMinisteres();
  }

  load(): void {
    this.directionService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.filteredItems.set(data);
      },
      error: () => this.showToast('Erreur lors du chargement des directions', 'error')
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) ||
      i.code?.toLowerCase().includes(term) ||
      this.getMinistereNom(i.ministereId)?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', ministereId: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Direction): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.code || !this.formData.nom || !this.formData.ministereId) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    this.saving.set(true);
    const obs = this.editingItem()
      ? this.directionService.update(this.editingItem()!.id, this.formData)
      : this.directionService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          this.editingItem() ? 'Direction modifiée avec succès' : 'Direction créée avec succès',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  confirmDelete(item: Direction): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette direction ?')) {
      this.directionService.delete(item.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Direction supprimée avec succès', 'success');
        },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
    }
  }

  getMinistereNom(id: string | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
