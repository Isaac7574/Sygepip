import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProgrammesService } from '@core/services/programmes.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { Programme, Ministere, Secteur } from '@core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './programmes.component.html',
  styleUrl: './programmes.component.scss'
})
export class ProgrammesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private programmesService = inject(ProgrammesService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);

  items = signal<Programme[]>([]);
  filteredItems = signal<Programme[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  detailMode = signal(false);
  loadingDetail = signal(false);
  errorMessage = signal('');
  detailItem = signal<Programme | null>(null);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Programme | null>(null);
  saving = signal(false);
  formData: Partial<Programme> = { code: '', nom: '', ministereId: undefined, secteurId: undefined, description: '', actif: true };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.detailMode.set(true);
      this.loadDetail(id);
      return;
    }

    this.load();
    this.loadMinisteres();
    this.loadSecteurs();
  }

  loadDetail(id: string): void {
    this.loadingDetail.set(true);
    this.errorMessage.set('');

    forkJoin({
      programme: this.programmesService.getById(id),
      ministeres: this.ministeresService.getAll(),
      secteurs: this.secteursService.getAll()
    }).subscribe({
      next: ({ programme, ministeres, secteurs }) => {
        this.detailItem.set(programme);
        this.ministeres.set(ministeres);
        this.secteurs.set(secteurs);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.errorMessage.set('Impossible de charger le programme budgetaire.');
      }
    });
  }

  load(): void {
    this.programmesService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => {}
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => {}
    });
  }

  loadSecteurs(): void {
    this.secteursService.getAll().subscribe({
      next: (data) => this.secteurs.set(data),
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
    this.formData = { code: '', nom: '', ministereId: undefined, secteurId: undefined, description: '', actif: true };
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  edit(item: Programme): void {
    this.formData = { ...item };
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  save(): void {
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.programmesService.update(this.editingItem()!.id, this.formData)
      : this.programmesService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(item: Programme): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      this.programmesService.delete(item.id).subscribe(() => this.load());
    }
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds FCFA';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M FCFA';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  getNiveauPrioriteLabel(value: Programme['niveauPriorite']): string {
    switch (value) {
      case 'PHARE':
        return 'Phare';
      case 'STRUCTURANT':
        return 'Structurant';
      case 'PRIORITAIRE':
        return 'Prioritaire';
      case 'NORMAL':
        return 'Normal';
      case 'DIFFERE':
        return 'Differe';
      default:
        return '-';
    }
  }
}
