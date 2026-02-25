import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SourcesFinancementService } from '@core/services/sources-financement.service';
import { SourceFinancement } from '@core/models';

@Component({
  selector: 'app-sources-de-financement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sources-financement.component.html',
  styleUrl: './sources-financement.component.scss'
})
export class SourcesdeFinancementComponent implements OnInit {
  private sourcesService = inject(SourcesFinancementService);

  items = signal<SourceFinancement[]>([]);
  filteredItems = signal<SourceFinancement[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<SourceFinancement | null>(null);
  saving = signal(false);
  formData: Partial<SourceFinancement> = { code: '', nom: '', type: 'INTERNE', description: '', paysOrigine: '', actif: true };

  types: Array<{value: string, label: string}> = [
    { value: 'INTERNE', label: 'Interne' },
    { value: 'EXTERNE', label: 'Externe' },
    { value: 'MIXTE', label: 'Mixte' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.sourcesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term) || i.type?.toLowerCase().includes(term) || i.paysOrigine?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', type: 'INTERNE', description: '', paysOrigine: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: SourceFinancement): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.sourcesService.update(this.editingItem()!.id, this.formData)
      : this.sourcesService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: SourceFinancement): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette source de financement ?')) {
      this.sourcesService.delete(item.id).subscribe(() => this.load());
    }
  }

  getTypeLabel(type: string): string {
    const found = this.types.find(t => t.value === type);
    return found ? found.label : type;
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'INTERNE': return 'badge-info';
      case 'EXTERNE': return 'badge-warning';
      case 'MIXTE': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
