import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjetsService } from '@core/services/projets.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { AutorisationEngagementService } from '@core/services/autorisation-engagement.service';
import { CreditPaiementService } from '@core/services/credit-paiement.service';
import { SourcesFinancementService } from '@core/services/sources-financement.service';
import { NatureDepenseService } from '@core/services/nature-depense.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import {
  Projet, Ministere, Secteur, Region, Programme, IdeeProjet,
  AutorisationEngagement, CreditPaiement, SourceFinancement, NatureDepense,
  CategorieProjet, TypeProjetPip, StatutInscriptionPip, ModeFinancement
} from '@core/models';

type ActiveTab = 'general' | 'technique' | 'financier';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './projet-detail.component.html',
  styleUrl: './projet-detail.component.scss'
})
export class ProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projetsService = inject(ProjetsService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);
  private ideesProjetService = inject(IdeesProjetService);
  private aeService = inject(AutorisationEngagementService);
  private cpService = inject(CreditPaiementService);
  private sourcesFinancementService = inject(SourcesFinancementService);
  private natureDepenseService = inject(NatureDepenseService);

  // ── État principal ──────────────────────────────────────────────────────
  projet = signal<Projet | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<ActiveTab>('general');

  // ── Référentiels ────────────────────────────────────────────────────────
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  sourcesFinancement = signal<SourceFinancement[]>([]);
  naturesDepense = signal<NatureDepense[]>([]);

  // ── Programmation technique ─────────────────────────────────────────────
  ptForm = {
    code: '',
    categorie: '' as CategorieProjet | '',
    programmeId: '',
    objectifsStrategiques: '',
    objectifsOperationnel: '',
    dateDebutPrevu: '',
    dateFinPrevu: '',
    dureeEnMois: null as number | null,
    typeProjetPip: '' as TypeProjetPip | '',
    statutInscriptionPip: '' as StatutInscriptionPip | '',
  };
  savingPT = signal(false);

  // ── AE ──────────────────────────────────────────────────────────────────
  aes = signal<AutorisationEngagement[]>([]);
  loadingAes = signal(false);
  selectedAe = signal<AutorisationEngagement | null>(null);
  showAeForm = signal(false);
  savingAe = signal(false);
  aeForm = {
    montantAe: null as number | null,
    sourceFinancementId: '',
    modeFinancement: '' as ModeFinancement | '',
    ligneBudgetaire: '',
    natureDepenseId: '',
    dateAutorisation: '',
    statut: '',
    observations: '',
    actif: true,
  };

  // ── CP ──────────────────────────────────────────────────────────────────
  cps = signal<CreditPaiement[]>([]);
  loadingCps = signal(false);
  showCpForm = signal(false);
  savingCp = signal(false);
  cpForm = {
    annee: null as number | null,
    montantCp: null as number | null,
    natureDepenseId: '',
    montantPaye: null as number | null,
    dateEcheance: '',
    statut: '',
    actif: true,
  };

  // ── Toast ───────────────────────────────────────────────────────────────
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // ── Listes d'options ────────────────────────────────────────────────────
  categoriesPip: { value: CategorieProjet; label: string }[] = [
    { value: 'CATEGORIE_1_ADMINISTRATION_DIRECTE', label: 'Catégorie 1 – Administration directe' },
    { value: 'CATEGORIE_2_STRUCTURE_AUTONOME',     label: 'Catégorie 2 – Structure autonome' },
    { value: 'CATEGORIE_3_AGENCES_PTF_ONG',        label: 'Catégorie 3 – Agences / PTF / ONG' },
    { value: 'CATEGORIE_4_PPP',                    label: 'Catégorie 4 – PPP' },
  ];

  typesProjetPip: { value: TypeProjetPip; label: string }[] = [
    { value: 'NOYAU_SUR', label: 'Noyau sûr' },
    { value: 'NATIONAL',  label: 'National' },
  ];

  statutsInscriptionPip: { value: StatutInscriptionPip; label: string }[] = [
    { value: 'EN_EXECUTION',      label: 'En exécution' },
    { value: 'INSTANCE_DEMARRAGE', label: 'Instance démarrage' },
  ];

  modesFinancement: { value: ModeFinancement; label: string }[] = [
    { value: 'CONTREPARTIE', label: 'Contrepartie' },
    { value: 'SUBVENTION',   label: 'Subvention' },
    { value: 'PRET',         label: 'Prêt' },
  ];

  statuts = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'TERMINE',  label: 'Terminé' },
    { value: 'ANNULE',   label: 'Annulé' }
  ];

  categories = [
    { value: 'NOUVEAU',       label: 'Nouveau' },
    { value: 'EN_COURS',      label: 'En cours' },
    { value: 'EXTENSION',     label: 'Extension' },
    { value: 'REHABILITATION', label: 'Réhabilitation' }
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.ministeresService.getAll().subscribe({ next: (d) => this.ministeres.set(d) });
    this.secteursService.getAll().subscribe({ next: (d) => this.secteurs.set(d) });
    this.regionsService.getAll().subscribe({ next: (d) => this.regions.set(d) });
    this.programmesService.getAll().subscribe({ next: (d) => this.programmes.set(d) });
    this.ideesProjetService.getAll().subscribe({ next: (d) => this.ideesProjet.set(d) });
    this.sourcesFinancementService.getAll().subscribe({ next: (d) => this.sourcesFinancement.set(d) });
    this.natureDepenseService.getAll().subscribe({ next: (d) => this.naturesDepense.set(d) });

    this.route.paramMap.subscribe(params => {
      const id = params.get('idprojet') ?? params.get('id');
      if (!id) {
        this.error.set('Identifiant du projet manquant.');
        this.loading.set(false);
        return;
      }
      this.loadProjet(id);
    });
  }

  // ── Chargement ───────────────────────────────────────────────────────────
  private loadProjet(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.projetsService.getById(id).subscribe({
      next: (data) => {
        const p = this.adaptProjetDates(data);
        this.projet.set(p);
        this.loading.set(false);
        this.initPtForm(p);
        this.loadAes(p.id);
      },
      error: () => {
        this.error.set('Erreur lors du chargement du projet.');
        this.loading.set(false);
      }
    });
  }

  private loadAes(projetId: string): void {
    this.loadingAes.set(true);
    this.aeService.getByProjet(projetId).subscribe({
      next: (data) => { this.aes.set(data); this.loadingAes.set(false); },
      error: ()   => { this.loadingAes.set(false); }
    });
  }

  private loadCps(aeId: string): void {
    this.loadingCps.set(true);
    this.cpService.getByAutorisationEngagement(aeId).subscribe({
      next: (data) => { this.cps.set(data); this.loadingCps.set(false); },
      error: ()    => { this.loadingCps.set(false); }
    });
  }

  // ── Initialisation formulaire PT ─────────────────────────────────────────
  private initPtForm(p: Projet): void {
    this.ptForm.code = p.code ?? '';
    this.ptForm.categorie = (p.categorie as CategorieProjet) ?? '';
    this.ptForm.programmeId = p.programmeId ?? '';
    this.ptForm.objectifsStrategiques = p.objectifsStrategiques ?? '';
    this.ptForm.objectifsOperationnel = p.objectifsOperationnel ?? '';
    this.ptForm.dateDebutPrevu = p.dateDebutPrevu ? this.toDatetimeLocal(p.dateDebutPrevu) : '';
    this.ptForm.dateFinPrevu   = p.dateFinPrevu   ? this.toDatetimeLocal(p.dateFinPrevu)   : '';
    this.ptForm.dureeEnMois    = p.dureeEnMois    ?? null;
    this.ptForm.typeProjetPip        = (p.typeProjetPip as TypeProjetPip) ?? '';
    this.ptForm.statutInscriptionPip = (p.statutInscriptionPip as StatutInscriptionPip) ?? '';
  }

  // ── Sauvegarde PT ────────────────────────────────────────────────────────
  saveProgrammationTechnique(): void {
    const p = this.projet();
    if (!p) return;
    this.savingPT.set(true);
    const payload: any = {
      code: this.ptForm.code || undefined,
      categorie: this.ptForm.categorie || undefined,
      programmeId: this.ptForm.programmeId || undefined,
      objectifsStrategiques: this.ptForm.objectifsStrategiques || undefined,
      objectifsOperationnel: this.ptForm.objectifsOperationnel || undefined,
      dateDebutPrevu: this.ptForm.dateDebutPrevu ? this.toIso(this.ptForm.dateDebutPrevu) : undefined,
      dateFinPrevu:   this.ptForm.dateFinPrevu   ? this.toIso(this.ptForm.dateFinPrevu)   : undefined,
      dureeEnMois: this.ptForm.dureeEnMois ?? undefined,
      typeProjetPip:        this.ptForm.typeProjetPip        || undefined,
      statutInscriptionPip: this.ptForm.statutInscriptionPip || undefined,
    };
    this.projetsService.updateProgrammationTechnique(p.id, payload).subscribe({
      next: (updated) => {
        this.projet.set(this.adaptProjetDates(updated));
        this.savingPT.set(false);
        this.showToast('Programmation technique enregistrée', 'success');
      },
      error: (err) => {
        this.savingPT.set(false);
        this.showToast(err?.message || 'Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // ── AE ───────────────────────────────────────────────────────────────────
  openAeForm(): void {
    this.aeForm = { montantAe: null, sourceFinancementId: '', modeFinancement: '',
      ligneBudgetaire: '', natureDepenseId: '', dateAutorisation: '',
      statut: '', observations: '', actif: true };
    this.showAeForm.set(true);
  }

  cancelAeForm(): void { this.showAeForm.set(false); }

  saveAe(): void {
    const p = this.projet();
    if (!p) return;
    this.savingAe.set(true);
    const payload: any = {
      montantAe: this.aeForm.montantAe ?? undefined,
      sourceFinancementId: this.aeForm.sourceFinancementId || undefined,
      modeFinancement: this.aeForm.modeFinancement || undefined,
      ligneBudgetaire: this.aeForm.ligneBudgetaire || undefined,
      natureDepenseId: this.aeForm.natureDepenseId || undefined,
      dateAutorisation: this.aeForm.dateAutorisation ? this.toIso(this.aeForm.dateAutorisation) : undefined,
      statut: this.aeForm.statut || undefined,
      observations: this.aeForm.observations || undefined,
      actif: this.aeForm.actif,
    };
    this.aeService.createForProjet(p.id, payload).subscribe({
      next: () => {
        this.savingAe.set(false);
        this.showAeForm.set(false);
        this.showToast('Autorisation d\'engagement créée', 'success');
        this.loadAes(p.id);
      },
      error: (err) => {
        this.savingAe.set(false);
        this.showToast(err?.message || 'Erreur lors de la création de l\'AE', 'error');
      }
    });
  }

  selectAe(ae: AutorisationEngagement): void {
    this.selectedAe.set(ae);
    this.showCpForm.set(false);
    this.cps.set([]);
    this.loadCps(ae.id);
  }

  // ── CP ───────────────────────────────────────────────────────────────────
  openCpForm(): void {
    this.cpForm = { annee: null, montantCp: null, natureDepenseId: '',
      montantPaye: null, dateEcheance: '', statut: '', actif: true };
    this.showCpForm.set(true);
  }

  cancelCpForm(): void { this.showCpForm.set(false); }

  saveCp(): void {
    const ae = this.selectedAe();
    if (!ae) return;
    this.savingCp.set(true);
    const payload: any = {
      annee: this.cpForm.annee ?? undefined,
      montantCp: this.cpForm.montantCp ?? undefined,
      natureDepenseId: this.cpForm.natureDepenseId || undefined,
      montantPaye: this.cpForm.montantPaye ?? undefined,
      dateEcheance: this.cpForm.dateEcheance ? this.toIso(this.cpForm.dateEcheance) : undefined,
      statut: this.cpForm.statut || undefined,
      actif: this.cpForm.actif,
    };
    this.cpService.createForAe(ae.id, payload).subscribe({
      next: () => {
        this.savingCp.set(false);
        this.showCpForm.set(false);
        this.showToast('Crédit de paiement créé', 'success');
        this.loadCps(ae.id);
      },
      error: (err) => {
        this.savingCp.set(false);
        this.showToast(err?.message || 'Erreur lors de la création du CP', 'error');
      }
    });
  }

  // ── Helpers date ─────────────────────────────────────────────────────────
  private toIso(datetimeLocal: string): string {
    // datetime-local gives YYYY-MM-DDTHH:mm → backend wants YYYY-MM-DDTHH:mm:ss
    return datetimeLocal.length === 16 ? datetimeLocal + ':00' : datetimeLocal;
  }

  private toDatetimeLocal(date: Date | string): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ── Adapt / Format ───────────────────────────────────────────────────────
  private adaptProjetDates(projet: any): Projet {
    return {
      ...projet,
      dateDebutPrevu: projet.dateDebutPrevu ? new Date(projet.dateDebutPrevu) : undefined,
      dateFinPrevu:   projet.dateFinPrevu   ? new Date(projet.dateFinPrevu)   : undefined,
      createdAt:    projet.createdAt    ? new Date(projet.createdAt)    : new Date(),
      dateCreation: projet.dateCreation ? new Date(projet.dateCreation) : new Date(),
      statut:    projet.statut    || 'PLANIFIE',
      categorie: projet.categorie || 'NOUVEAU'
    };
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
    return p ? (p.code + ' – ' + p.nom) : '-';
  }

  getIdeeProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? (ip.code + ' – ' + ip.titre) : '-';
  }

  getSourceFinancementNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.sourcesFinancement().find(s => String(s.id) === String(id));
    return s ? (s.code + ' – ' + s.nom) : '-';
  }

  getNatureDepenseNom(id: string | number | undefined): string {
    if (!id) return '-';
    const n = this.naturesDepense().find(n => String(n.id) === String(id));
    return n ? (n.code + ' – ' + n.nom) : '-';
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
      'TERMINE':  'badge-success',
      'ANNULE':   'badge-secondary'
    };
    return classes[statut] || 'badge-secondary';
  }

  formatBudget(value: number | undefined): string {
    if (value == null) return '-';
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + ' Mds';
    if (value >= 1_000_000)     return (value / 1_000_000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
