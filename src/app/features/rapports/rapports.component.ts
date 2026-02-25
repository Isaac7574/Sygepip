import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportsService } from '@core/services/rapports.service';
import { ProjetsService } from '@core/services/projets.service';
import { RapportPerformance, Projet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss'
})
export class RapportsComponent implements OnInit {
  private rapportsService = inject(RapportsService);
  private projetsService = inject(ProjetsService);

  items = signal<RapportPerformance[]>([]);
  filteredItems = signal<RapportPerformance[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<RapportPerformance | null>(null);
  saving = signal(false);
  formData: Partial<RapportPerformance> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: RapportPerformance | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  statuts = [
    { value: 'CONFORME', label: 'Conforme' },
    { value: 'ALERTE', label: 'Alerte' },
    { value: 'CRITIQUE', label: 'Critique' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadProjets();
  }

  private resetForm(): Partial<RapportPerformance> {
    return {
      projetId: undefined,
      annee: new Date().getFullYear(),
      periode: '',
      tauxExecutionPhysique: undefined,
      tauxExecutionFinancier: undefined,
      indicePerformance: undefined,
      statut: 'CONFORME',
      commentaires: ''
    };
  }

  load(): void {
    this.rapportsService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => this.showToast('Erreur lors du chargement des rapports', 'error')
    });
  }

  loadProjets(): void {
    this.projetsService.getAll().subscribe({ next: (data) => this.projets.set(data) });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.periode?.toLowerCase().includes(term) ||
      i.statut?.toLowerCase().includes(term) ||
      String(i.annee).includes(term) ||
      this.getProjetNom(i.projetId).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: RapportPerformance): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.formData.annee) {
      this.showToast('Veuillez renseigner l\'ann\u00e9e', 'error');
      return;
    }
    if (!this.formData.projetId) {
      this.showToast('Veuillez s\u00e9lectionner un projet', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.rapportsService.update(this.editingItem()!.id, this.formData)
      : this.rapportsService.create(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Rapport modifi\u00e9 avec succ\u00e8s' : 'Rapport cr\u00e9\u00e9 avec succ\u00e8s', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: RapportPerformance): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le rapport';
    this.confirmDialogMessage = '\u00cates-vous s\u00fbr de vouloir supprimer ce rapport de performance ?';
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.rapportsService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Rapport supprim\u00e9 avec succ\u00e8s', 'success'); },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
    }
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.itemToDelete = null;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }

  getProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const p = this.projets().find(p => String(p.id) === String(id));
    return p ? p.titre : '-';
  }

  getStatutLabel(value: string): string {
    return this.statuts.find(s => s.value === value)?.label || value;
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'CONFORME': return 'badge-success';
      case 'ALERTE': return 'badge-warning';
      case 'CRITIQUE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
