import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuiviExecutionService } from '@core/services/suivi-execution.service';
import { ProjetsService } from '@core/services/projets.service';
import { Projet, SuiviExecution } from '@core/models';

@Component({
  selector: 'app-suivi-execution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './execution.component.html',
  styleUrl: './execution.component.scss'
})
export class SuiviExecutionComponent implements OnInit {
  private suiviService = inject(SuiviExecutionService);
  private projetsService = inject(ProjetsService);

  items = signal<SuiviExecution[]>([]);
  filteredItems = signal<SuiviExecution[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<SuiviExecution | null>(null);
  saving = signal(false);
  formData: Partial<SuiviExecution> = this.resetForm();

  typesPeriode = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'TRIMESTRIEL', label: 'Trimestriel' },
    { value: 'SEMESTRIEL', label: 'Semestriel' },
    { value: 'ANNUEL', label: 'Annuel' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadProjets();
  }

  private resetForm(): Partial<SuiviExecution> {
    return {
      projetId: '',
      tauxAvancementPhysique: 0,
      actif: true
    };
  }

  load(): void {
    this.suiviService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  loadProjets(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => this.projets.set(data),
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.code?.toLowerCase().includes(term) ||
      i.periode?.toLowerCase().includes(term) ||
      this.getProjetNom(i.projetId).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
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
    if (!this.formData.projetId) {
      return;
    }

    this.saving.set(true);
    const payload: Partial<SuiviExecution> = {
      projetId: this.formData.projetId,
      tauxAvancementPhysique: this.formData.tauxAvancementPhysique ?? 0,
      actif: this.formData.actif ?? true
    };
    const obs = this.editingItem()
      ? this.suiviService.update(this.editingItem()!.id, payload)
      : this.suiviService.create(payload);
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

  getProjetNom(projetId: string | undefined): string {
    if (!projetId) return '-';
    return this.projets().find((projet) => projet.id === projetId)?.titre || '-';
  }
}
