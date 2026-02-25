import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndicateursService } from '@core/services/indicateurs.service';
import { Indicateur } from '@core/models';

@Component({
  selector: 'app-indicateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indicateurs.component.html',
  styleUrl: './indicateurs.component.scss'
})
export class IndicateursComponent implements OnInit {
  private indicateursService = inject(IndicateursService);

  items = signal<Indicateur[]>([]);
  filteredItems = signal<Indicateur[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Indicateur | null>(null);
  saving = signal(false);
  formData: Partial<Indicateur> = { code: '', nom: '', description: '', unite: '', valeurCible: undefined, valeurActuelle: undefined, frequenceMesure: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.indicateursService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
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
    this.formData = { code: '', nom: '', description: '', unite: '', valeurCible: undefined, valeurActuelle: undefined, frequenceMesure: '' };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Indicateur): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.indicateursService.update(this.editingItem()!.id, this.formData)
      : this.indicateursService.create(this.formData);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Indicateur): void {
    if (confirm('\u00cates-vous s\u00fbr de vouloir supprimer cet indicateur ?')) {
      this.indicateursService.delete(item.id).subscribe(() => this.load());
    }
  }

  getProgress(item: Indicateur): number {
    if (!item.valeurCible || !item.valeurActuelle) return 0;
    return Math.min(100, Math.round((item.valeurActuelle / item.valeurCible) * 100));
  }
}
