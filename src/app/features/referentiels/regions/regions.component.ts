import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegionsService } from '@core/services/regions.service';
import { Region } from '@core/models';

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './regions.component.html',
  styleUrl: './regions.component.scss'
})
export class RegionsComponent implements OnInit {
  private regionsService = inject(RegionsService);

  items = signal<Region[]>([]);
  filteredItems = signal<Region[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Region | null>(null);
  saving = signal(false);
  formData: Partial<Region> = { code: '', nom: '', chefLieu: '', actif: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.regionsService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term) || i.chefLieu?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', chefLieu: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Region): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
     console.log(this.formData);
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.regionsService.update(this.editingItem()!.id, this.formData)
      : this.regionsService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Region): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
      this.regionsService.delete(item.id).subscribe(() => this.load());
    }
  }

  formatNumber(value: number | undefined): string {
    if (!value) return '-';
    return value.toLocaleString('fr-FR');
  }
}
