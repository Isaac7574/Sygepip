import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CiblesService } from '@core/services/cibles.service';
import { Cible } from '@core/models';

@Component({
  selector: 'app-beneficiaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiaires.component.html',
  styleUrl: './beneficiaires.component.scss'
})
export class BeneficiairesComponent implements OnInit {
  private ciblesService = inject(CiblesService);

  items = signal<Cible[]>([]);
  filteredItems = signal<Cible[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Cible | null>(null);
  saving = signal(false);
  formData: { libelle: string; description: string; quantiteEstimee: number | null; actif: boolean } = {
    libelle: '',
    description: '',
    quantiteEstimee: null,
    actif: true
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.ciblesService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.filteredItems.set(data);
      },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(item =>
      this.getLibelle(item).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { libelle: '', description: '', quantiteEstimee: null, actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(item: Cible): void {
    this.formData = {
      libelle: this.getLibelle(item),
      description: item.description || '',
      quantiteEstimee: item.quantiteEstimee ?? null,
      actif: item.actif ?? true
    };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    const libelle = this.formData.libelle.trim();
    if (!libelle || this.saving()) {
      return;
    }

    this.saving.set(true);
    const payload = {
      libelle,
      description: this.formData.description.trim() || undefined,
      quantiteEstimee: this.formData.quantiteEstimee ?? undefined,
      actif: this.formData.actif
    };

    const request = this.editingItem()
      ? this.ciblesService.update(this.editingItem()!.id, payload)
      : this.ciblesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: Cible): void {
    if (confirm(`Supprimer le beneficiaire "${this.getLibelle(item)}" ?`)) {
      this.ciblesService.delete(item.id).subscribe(() => this.load());
    }
  }

  getLibelle(item: Partial<Cible>): string {
    return item.libelle || item.nom || '-';
  }
}
