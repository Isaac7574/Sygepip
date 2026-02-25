import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgrammesService } from '@core/services/programmes.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { Programme, Ministere, Secteur } from '@core/models';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programmes.component.html',
  styleUrl: './programmes.component.scss'
})
export class ProgrammesComponent implements OnInit {
  private programmesService = inject(ProgrammesService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);

  items = signal<Programme[]>([]);
  filteredItems = signal<Programme[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Programme | null>(null);
  saving = signal(false);
  formData: Partial<Programme> = { code: '', nom: '', ministereId: undefined, secteurId: undefined, description: '', actif: true };

  ngOnInit(): void {
    this.load();
    this.loadMinisteres();
    this.loadSecteurs();
  }

  load(): void {
    this.programmesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => {}
    });
  }

  loadSecteurs(): void {
    this.secteursService.getAll().subscribe({
      next: (data) => this.secteurs.set(data),
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', ministereId: undefined, secteurId: undefined, description: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Programme): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.programmesService.update(this.editingItem()!.id, this.formData)
      : this.programmesService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Programme): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      this.programmesService.delete(item.id).subscribe(() => this.load());
    }
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds FCFA';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M FCFA';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }
}
