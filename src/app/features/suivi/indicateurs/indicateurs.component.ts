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
  formData: Partial<Indicateur> = this.resetForm();

  ngOnInit(): void {
    this.load();
  }

  private resetForm(): Partial<Indicateur> {
    return {
      code: '',
      nom: '',
      description: '',
      typeIndicateur: '',
      unite: '',
      valeurReference: undefined,
      sourceVerification: '',
      periodicite: '',
      actif: true
    };
  }

  load(): void {
    this.indicateursService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nom?.toLowerCase().includes(term) ||
      i.code?.toLowerCase().includes(term) ||
      i.typeIndicateur?.toLowerCase().includes(term) ||
      i.unite?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
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
    if (!this.formData.code || !this.formData.nom) {
      return;
    }

    this.saving.set(true);
    const payload: Partial<Indicateur> = {
      code: this.formData.code?.trim(),
      nom: this.formData.nom?.trim(),
      description: this.formData.description?.trim() || undefined,
      typeIndicateur: this.formData.typeIndicateur?.trim() || undefined,
      unite: this.formData.unite?.trim() || undefined,
      valeurReference: this.formData.valeurReference,
      sourceVerification: this.formData.sourceVerification?.trim() || undefined,
      periodicite: this.formData.periodicite?.trim() || undefined,
      actif: this.formData.actif ?? true
    };
    const obs = this.editingItem()
      ? this.indicateursService.update(this.editingItem()!.id, payload)
      : this.indicateursService.create(payload);
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

}
