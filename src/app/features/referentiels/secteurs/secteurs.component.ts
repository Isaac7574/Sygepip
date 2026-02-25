import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecteursService } from '@core/services/secteurs.service';
import { Secteur } from '@core/models';

@Component({
  selector: 'app-secteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './secteurs.component.html',
  styleUrl: './secteurs.component.scss'
})
export class SecteursComponent implements OnInit {
  private secteursService = inject(SecteursService);

  items = signal<Secteur[]>([]);
  filteredItems = signal<Secteur[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Secteur | null>(null);
  saving = signal(false);
  formData: Partial<Secteur> = { code: '', nom: '', description: '', couleur: '#3B82F6', actif: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.secteursService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term) || i.description?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', nom: '', description: '', couleur: '#3B82F6', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Secteur): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.secteursService.update(this.editingItem()!.id, this.formData)
      : this.secteursService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Secteur): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) {
      this.secteursService.delete(item.id).subscribe(() => this.load());
    }
  }
}
