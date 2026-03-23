import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjetsService } from '@core/services/projets.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { PipAnnuelService } from '@core/services/pip-annuel.service';
import { UtilisateursService } from '@core/services/utilisateurs.service';
import {
  Projet,
  Ministere,
  Secteur,
  Region,
  Programme,
  IdeeProjet,
  PipAnnuel,
  User,
  CategorieProjet,
  StatutProjet,
  TypeProjetPip,
  StatutInscriptionPip
} from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-projets-pip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.scss'
})
export class ProjetsPIPComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projetsService = inject(ProjetsService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);
  private ideesProjetService = inject(IdeesProjetService);
  private pipAnnuelService = inject(PipAnnuelService);
  private utilisateursService = inject(UtilisateursService);

  items = signal<Projet[]>([]);
  filteredItems = signal<Projet[]>([]);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  pipAnnuels = signal<PipAnnuel[]>([]);
  utilisateurs = signal<User[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<Projet | null>(null);
  saving = signal(false);
  formData: Partial<Projet> = this.resetForm();
  private pendingEditId: string | null = null;

  viewingItem = signal<Projet | null>(null);
  detailOpen = signal(false);

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: Projet | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  categories: { value: CategorieProjet; label: string }[] = [
    { value: 'CATEGORIE_1_ADMINISTRATION_DIRECTE', label: 'Catégorie 1 - Administration directe' },
    { value: 'CATEGORIE_2_STRUCTURE_AUTONOME', label: 'Catégorie 2 - Structure autonome' },
    { value: 'CATEGORIE_3_AGENCES_PTF_ONG', label: 'Catégorie 3 - Agences/PTF/ONG' },
    { value: 'CATEGORIE_4_PPP', label: 'Catégorie 4 - PPP' }
  ];

  typesProjetPip: { value: TypeProjetPip; label: string }[] = [
    { value: 'NOYAU_SUR', label: 'Noyau sûr' },
    { value: 'NATIONAL', label: 'National' }
  ];

  statutsInscriptionPip: { value: StatutInscriptionPip; label: string }[] = [
    { value: 'EN_EXECUTION', label: 'En exécution' },
    { value: 'INSTANCE_DEMARRAGE', label: 'Instance de démarrage' }
  ];

  sourcesFinancement: { value: string; label: string }[] = [
    { value: 'BUDGET_ETAT', label: 'Budget de l\'État' },
    { value: 'EXTERIEUR', label: 'Financement extérieur' },
    { value: 'MIXTE', label: 'Mixte' },
    { value: 'PPP', label: 'Partenariat Public-Privé' }
  ];

  statuts: { value: StatutProjet; label: string }[] = [
    { value: 'CREE', label: 'Créé' },
    { value: 'PIP_TECHNIQUE_EN_COURS', label: 'PIP technique en cours' },
    { value: 'PIP_TECHNIQUE_SOUMIS', label: 'PIP technique soumis' },
    { value: 'PIP_TECHNIQUE_VALIDE', label: 'PIP technique validé' },
    { value: 'PIP_TECHNIQUE_A_CORRIGER', label: 'PIP technique à corriger' },
    { value: 'PIP_FINANCIER_CREE', label: 'PIP financier créé' },
    { value: 'EN_ARBITRAGE', label: 'En arbitrage' },
    { value: 'ARBITRAGE_RETENU', label: 'Arbitrage retenu' },
    { value: 'ARBITRAGE_AJOURNE', label: 'Arbitrage ajourné' },
    { value: 'PIP_VALIDE', label: 'PIP validé' },
    { value: 'EN_EXECUTION', label: 'En exécution' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'CLOTURE', label: 'Clôturé' }
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const editId = params.get('editId');
      this.pendingEditId = editId;
      if (editId && this.items().length > 0) {
        this.openEditById(editId);
      }
    });
    this.load();
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
    this.regionsService.getAll().subscribe({ next: (data) => this.regions.set(data) });
    this.programmesService.getAll().subscribe({ next: (data) => this.programmes.set(data) });
    this.ideesProjetService.getAll().subscribe({ next: (data) => this.ideesProjet.set(data) });
    this.pipAnnuelService.getAll().subscribe({ next: (data) => this.pipAnnuels.set(data) });
    this.utilisateursService.getAll().subscribe({ next: (data) => this.utilisateurs.set(data) });
  }

  private resetForm(): Partial<Projet> {
    return {
      code: '', titre: '', categorie: 'CATEGORIE_1_ADMINISTRATION_DIRECTE', ministereId: undefined,
      secteurId: undefined, regionId: undefined, programmeId: undefined,
      ideeProjetId: undefined, description: '', objectifsStrategiques: '', objectifsOperationnel: '',
      coutTotal: 0,
      dateDebutPrevu: undefined, dateFinPrevu: undefined, dureeEnMois: undefined,
      statut: 'CREE', latitude: undefined, longitude: undefined, financementBoucle: false, actif: true,
      pipAnnuelId: undefined, sourceFinancement: undefined,
      chefProjetId: undefined, typeProjetPip: undefined, statutInscriptionPip: undefined
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
      statut: projet.statut || 'CREE',
      categorie: projet.categorie || 'CATEGORIE_1_ADMINISTRATION_DIRECTE'
    };
  }

  load(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => {
        const adapted = data.map(this.adaptProjetDates);
        console.log('Projets chargés adaptés :', adapted);
        this.items.set(adapted);
        this.filteredItems.set(adapted);
        if (this.pendingEditId) {
          this.openEditById(this.pendingEditId);
        }
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

  view(item: Projet): void {
    this.viewingItem.set(item);
    this.detailOpen.set(true);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.viewingItem.set(null);
  }

  private openEditById(id: string): void {
    const item = this.items().find(i => String(i.id) === String(id));
    if (item) {
      this.edit(item);
      this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
      this.pendingEditId = null;
    }
  }

   edit(item: Projet): void {
    this.formData = this.adaptProjetDates(item);
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }


  private toIsoDate(val: Date | string | undefined): string | undefined {
    if (!val) return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private buildUpdatePayload() {
    const raw: Record<string, any> = {
      ideeProjetId: this.formData.ideeProjetId,
      reference: this.formData.code,
      categorie: this.formData.categorie,
      programmeId: this.formData.programmeId,
      objectifsStrategiques: this.formData.objectifsStrategiques,
      objectifsOperationnel: this.formData.objectifsOperationnel,
      coutTotal: this.formData.coutTotal,
      dateCreation: this.toIsoDate(this.formData.dateCreation),
      dateDebutPrevu: this.toIsoDate(this.formData.dateDebutPrevu),
      dateFinPrevu: this.toIsoDate(this.formData.dateFinPrevu),
      pipAnnuelId: this.formData.pipAnnuelId,
      sourceFinancement: this.formData.sourceFinancement,
      dureeEnMois: this.formData.dureeEnMois,
      statut: this.formData.statut,
      etapeId: this.formData.etapeId,
      chefProjetId: this.formData.chefProjetId,
      typeProjetPip: this.formData.typeProjetPip,
      statutInscriptionPip: this.formData.statutInscriptionPip,
      financementBoucle: this.formData.financementBoucle,
      createdBy: this.formData.createdBy,
      actif: this.formData.actif
    };
    // Supprimer les clés undefined ou null pour ne pas polluer le payload
    Object.keys(raw).forEach(k => { if (raw[k] === undefined || raw[k] === null) delete raw[k]; });
    console.log('UPDATE payload:', raw);
    return raw;
  }

  save(): void {
    if (!this.editingItem()) {
      if (!this.formData.code || !this.formData.titre) {
        this.showToast('Le code et le titre sont obligatoires', 'error');
        return;
      }
      if (!this.formData.ministereId) {
        this.showToast('Veuillez sélectionner un ministère', 'error');
        return;
      }
    }
    this.saving.set(true);
    const obs = this.editingItem()
      ? this.projetsService.update(this.editingItem()!.id, this.buildUpdatePayload())
      : this.projetsService.create(this.formData);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(this.editingItem() ? 'Projet modifié avec succès' : 'Projet créé avec succès', 'success');
      },
      error: (err) => { this.saving.set(false); console.error('Erreur update projet:', err); this.showToast(err?.message || 'Erreur lors de l\'enregistrement', 'error'); }
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
      'CREE': 'badge-info',
      'PIP_TECHNIQUE_EN_COURS': 'badge-warning',
      'PIP_TECHNIQUE_SOUMIS': 'badge-info',
      'PIP_TECHNIQUE_VALIDE': 'badge-success',
      'PIP_TECHNIQUE_A_CORRIGER': 'badge-danger',
      'PIP_FINANCIER_CREE': 'badge-info',
      'EN_ARBITRAGE': 'badge-warning',
      'ARBITRAGE_RETENU': 'badge-success',
      'ARBITRAGE_AJOURNE': 'badge-secondary',
      'PIP_VALIDE': 'badge-success',
      'EN_EXECUTION': 'badge-warning',
      'SUSPENDU': 'badge-danger',
      'CLOTURE': 'badge-secondary'
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

  calculerDuree(): void {
    const debut = this.formData.dateDebutPrevu;
    const fin = this.formData.dateFinPrevu;
    if (!debut || !fin) return;
    const d = new Date(debut);
    const f = new Date(fin);
    if (f <= d) { this.formData.dureeEnMois = 0; return; }
    const mois = (f.getFullYear() - d.getFullYear()) * 12 + (f.getMonth() - d.getMonth());
    this.formData.dureeEnMois = mois;
  }
}
