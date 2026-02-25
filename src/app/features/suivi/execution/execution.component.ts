import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuiviExecutionService } from '@core/services/suivi-execution.service';
import { SuiviExecution } from '@core/models';

@Component({
  selector: 'app-suivi-execution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './execution.component.html',
  styleUrl: './execution.component.scss'
})
export class SuiviExecutionComponent implements OnInit {
  private suiviService = inject(SuiviExecutionService);

  items = signal<SuiviExecution[]>([]);
  filteredItems = signal<SuiviExecution[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<SuiviExecution | null>(null);
  saving = signal(false);
  formData: Partial<SuiviExecution> = { code: '', periode: '', typePeriode: 'TRIMESTRIEL', annee: new Date().getFullYear(), tauxAvancementPhysique: 0, tauxAvancementFinancier: 0, observations: '', actif: true };

  typesPeriode = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'TRIMESTRIEL', label: 'Trimestriel' },
    { value: 'SEMESTRIEL', label: 'Semestriel' },
    { value: 'ANNUEL', label: 'Annuel' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.suiviService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.code?.toLowerCase().includes(term) || i.periode?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { code: '', periode: '', typePeriode: 'TRIMESTRIEL', annee: new Date().getFullYear(), tauxAvancementPhysique: 0, tauxAvancementFinancier: 0, observations: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: SuiviExecution): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.suiviService.update(this.editingItem()!.id, this.formData)
      : this.suiviService.create(this.formData);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: SuiviExecution): void {
    if (confirm('\u00cates-vous s\u00fbr de vouloir supprimer ce suivi ?')) {
      this.suiviService.delete(item.id).subscribe(() => this.load());
    }
  }
}
