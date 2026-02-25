import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjetsService } from '@core/services/projets.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { Projet, Ministere, Secteur, Region, Programme, IdeeProjet } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-projets-pip',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.scss'
})
export class ProjetsPIPComponent implements OnInit {
  private projetsService = inject(ProjetsService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);
  private ideesProjetService = inject(IdeesProjetService);

  items = signal<Projet[]>([]);
  filteredItems = signal<Projet[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  detailOpen = signal(false);
  viewingItem = signal<Projet | null>(null);
  editingItem = signal<Projet | null>(null);
  saving = signal(false);
  formData: Partial<Projet> = this.resetForm();

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Projet | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  categories = [
    { value: 'NOUVEAU', label: 'Nouveau' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EXTENSION', label: 'Extension' },
    { value: 'REHABILITATION', label: 'Réhabilitation' }
  ];

  statuts = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  ngOnInit(): void {
    this.load();
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
    this.regionsService.getAll().subscribe({ next: (data) => this.regions.set(data) });
    this.programmesService.getAll().subscribe({ next: (data) => this.programmes.set(data) });
    this.ideesProjetService.getAll().subscribe({ next: (data) => this.ideesProjet.set(data) });
  }

  private resetForm(): Partial<Projet> {
    return {
      code: '', titre: '', categorie: 'NOUVEAU', ministereId: undefined,
      secteurId: undefined, regionId: undefined, programmeId: undefined,
      ideeProjetId: undefined, description: '', objectifs: '',
      coutTotal: 0,
      dateDebutPrevu: undefined, dateFinPrevu: undefined, dureeEnMois: undefined,
      statut: 'PLANIFIE', latitude: undefined, longitude: undefined, actif: true
    };
  }

  // Conversion des dates string en Date
  private adaptProjetDates(projet: any): Projet {
    return {
      ...projet,
      dateDebut: projet.dateDebut ? new Date(projet.dateDebut) : undefined,
      dateFin: projet.dateFin ? new Date(projet.dateFin) : undefined,
      dateDebutPrevu: projet.dateDebutPrevu ? new Date(projet.dateDebutPrevu) : undefined,
      dateFinPrevu: projet.dateFinPrevu ? new Date(projet.dateFinPrevu) : undefined,
      createdAt: projet.createdAt ? new Date(projet.createdAt) : new Date(),
      dateCreation: projet.dateCreation ? new Date(projet.dateCreation) : new Date(),
      statut: projet.statut || 'PLANIFIE',
      categorie: projet.categorie || 'NOUVEAU'
    };
  }

  load(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => {
        const adapted = data.map(this.adaptProjetDates);
        console.log('Projets chargés adaptés :', adapted);
        this.items.set(adapted);
        this.filteredItems.set(adapted);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets :', err);
        this.showToast('Erreur lors du chargement des projets', 'error');
      }
    });
  }





  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.titre?.toLowerCase().includes(term) || i.code?.toLowerCase().includes(term) ||
      this.getMinistereNom(i.ministereId).toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  viewDetail(item: Projet): void {
    this.viewingItem.set(item);
    this.detailOpen.set(true);
  }

  closeDetail(): void { this.detailOpen.set(false); }

   edit(item: Projet): void {
    this.formData = this.adaptProjetDates(item);
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }


  save(): void {
    if (!this.formData.code || !this.formData.titre) {
      this.showToast('Le code et le titre sont obligatoires', 'error');
      return;
    }
    if (!this.formData.ministereId) {
      this.showToast('Veuillez sélectionner un ministère', 'error');
      return;
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.projetsService.update(this.editingItem()!.id, this.formData)
      : this.projetsService.create(this.formData);
      console.log(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Projet modifié avec succès' : 'Projet créé avec succès', 'success');
      },
      error: () => { this.saving.set(false); this.showToast('Erreur lors de l\'enregistrement', 'error'); }
    });
  }

  confirmDelete(item: Projet): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le projet';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer le projet "${item.code} - ${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.projetsService.delete(this.itemToDelete.id).subscribe({
        next: () => { this.load(); this.showToast('Projet supprimé avec succès', 'success'); },
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

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? m.nom : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  getRegionNom(id: string | number | undefined): string {
    if (!id) return '-';
    const r = this.regions().find(r => String(r.id) === String(id));
    return r ? r.nom : '-';
  }

  getProgrammeNom(id: string | number | undefined): string {
    if (!id) return '-';
    const p = this.programmes().find(p => String(p.id) === String(id));
    return p ? (p.code + ' - ' + p.nom) : '-';
  }

  getIdeeProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? (ip.code + ' - ' + ip.titre) : '-';
  }

  getCategorieLabel(value: string | undefined): string {
    if (!value) return '-';
    return this.categories.find(c => c.value === value)?.label || value;
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'PLANIFIE': 'badge-info',
      'EN_COURS': 'badge-warning',
      'SUSPENDU': 'badge-danger',
      'TERMINE': 'badge-success',
      'ANNULE': 'badge-secondary'
    };
    return classes[statut] || 'badge-secondary';
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
