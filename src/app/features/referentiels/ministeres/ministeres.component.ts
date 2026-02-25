import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MinisteresService } from '@core/services/ministeres.service';
import { Ministere } from '@core/models';

@Component({
  selector: 'app-ministeres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ministeres.component.html',
  styleUrl: './ministeres.component.scss'
})
export class MinisteresComponent implements OnInit {
  private ministeresService = inject(MinisteresService);

  items = signal<Ministere[]>([]);
  filteredItems = signal<Ministere[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Ministere | null>(null);
  saving = signal(false);
  formData: Partial<Ministere> = { sigle: '', nom: '', code: '', actif: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.sigle?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { sigle: '', nom: '', code: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Ministere): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    console.log(this.formData);
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.ministeresService.update(this.editingItem()!.id, this.formData)
      : this.ministeresService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Ministere): void {
    if (confirm('\u00cates-vous s\u00fbr de vouloir supprimer ce minist\u00e8re ?')) {
      this.ministeresService.delete(item.id).subscribe(() => this.load());
    }
  }
}
