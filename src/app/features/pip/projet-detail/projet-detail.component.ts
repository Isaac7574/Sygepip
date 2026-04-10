import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProjetsService } from '@core/services/projets.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { AutorisationEngagementService } from '@core/services/autorisation-engagement.service';
import { CreditPaiementService } from '@core/services/credit-paiement.service';
import { DecaissementService } from '@core/services/decaissement.service';
import { IndicateursService } from '@core/services/indicateurs.service';
import { SourcesFinancementService } from '@core/services/sources-financement.service';
import { NatureDepenseService } from '@core/services/nature-depense.service';
import { SuiviExecutionService } from '@core/services/suivi-execution.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import {
  Projet, Ministere, Secteur, Region, Programme, IdeeProjet,
  AutorisationEngagement, CreditPaiement, SourceFinancement, NatureDepense,
  CategorieProjet, TypeProjetPip, StatutInscriptionPip, ModeFinancement, Decaissement, Indicateur
} from '@core/models';

type ActiveTab = 'general' | 'technique' | 'financier' | 'indicateurs' | 'suivi-indicateurs';

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
  private decaissementService = inject(DecaissementService);
  private indicateursService = inject(IndicateursService);
  private sourcesFinancementService = inject(SourcesFinancementService);
  private natureDepenseService = inject(NatureDepenseService);
  private suiviExecutionService = inject(SuiviExecutionService);

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
  selectedCp = signal<CreditPaiement | null>(null);
  selectedCpProjet = signal<Projet | null>(null);
  cpForm = {
    annee: null as number | null,
    montantCp: null as number | null,
    natureDepenseId: '',
    montantPaye: null as number | null,
    dateEcheance: '',
    statut: '',
    actif: true,
  };

  // ── Décaissement ───────────────────────────────────────────────────────────────
  decaissements = signal<Decaissement[]>([]);
  loadingDecaissements = signal(false);
  showDecaissementForm = signal(false);
  savingDecaissement = signal(false);
  switchingToExecution = signal(false);
  activatingDecaissement = signal(false);
  decaissementForm = {
    dateDecaissement: '',
    montant: null as number | null,
    referencePiece: '',
    commentaire: '',
  };

  allIndicateurs = signal<Indicateur[]>([]);
  projetIndicateurs = signal<Indicateur[]>([]);
  loadingIndicateurs = signal(false);
  associatingIndicateur = signal(false);
  savingValeurIndicateurId = signal<string | null>(null);
  showAllIndicateurs = signal(false);
  indicateurValeursActuelles: Record<string, number | null> = {};

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
        this.loadIndicateurs(p.id);
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
      next: (data) => {
        const projetId = this.projet()?.id;
        const cps = projetId
          ? data.filter((cp) => !cp.projetId || cp.projetId === projetId)
          : data;
        this.cps.set(cps);
        this.loadingCps.set(false);
      },
      error: ()    => { this.loadingCps.set(false); }
    });
  }

  private loadIndicateurs(projetId: string): void {
    this.loadingIndicateurs.set(true);
    forkJoin({
      allIndicateurs: this.indicateursService.getAll(),
      projetIndicateurs: this.projetsService.getIndicateurs(projetId)
    }).subscribe({
      next: ({ allIndicateurs, projetIndicateurs }) => {
        this.allIndicateurs.set(allIndicateurs);
        this.projetIndicateurs.set(projetIndicateurs);
        this.indicateurValeursActuelles = Object.fromEntries(
          projetIndicateurs.map((indicateur) => [indicateur.id, indicateur.valeurActuelle ?? null])
        );
        this.loadingIndicateurs.set(false);
      },
      error: () => {
        this.loadingIndicateurs.set(false);
      }
    });
  }

  private loadDecaissements(creditPaiementId: string): void {
    this.loadingDecaissements.set(true);
    this.decaissementService.getByCreditPaiement(creditPaiementId).subscribe({
      next: (data) => {
        const projetId = this.selectedCpProjet()?.id ?? this.selectedCp()?.projetId ?? this.projet()?.id;
        const decaissements = data.filter((decaissement) => {
          const sameCp = decaissement.creditPaiementId === creditPaiementId;
          const sameProjet = !projetId || !decaissement.projetId || decaissement.projetId === projetId;
          return sameCp && sameProjet;
        });
        this.decaissements.set(decaissements);
        this.loadingDecaissements.set(false);
      },
      error: () => {
        this.decaissements.set([]);
        this.loadingDecaissements.set(false);
      }
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
    this.selectedCp.set(null);
    this.selectedCpProjet.set(null);
    this.showDecaissementForm.set(false);
    this.decaissements.set([]);
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
  selectCp(cp: CreditPaiement): void {
    this.selectedCp.set(cp);
    this.selectedCpProjet.set(null);
    this.showDecaissementForm.set(false);
    this.decaissements.set([]);
    this.loadDecaissements(cp.id);
    if (cp.projetId) {
      this.projetsService.getById(cp.projetId).subscribe({
        next: (projet) => this.selectedCpProjet.set(this.adaptProjetDates(projet)),
        error: () => this.selectedCpProjet.set(null)
      });
    }
  }

  getVisibleIndicateurs(): Indicateur[] {
    const indicateurs = this.allIndicateurs();
    return this.showAllIndicateurs() ? indicateurs : indicateurs.slice(0, 10);
  }

  hasMoreIndicateurs(): boolean {
    return this.allIndicateurs().length > 10;
  }

  isIndicateurLinked(indicateur: Indicateur): boolean {
    return this.projetIndicateurs().some((item) => item.id === indicateur.id);
  }

  toggleShowAllIndicateurs(): void {
    this.showAllIndicateurs.set(!this.showAllIndicateurs());
  }

  toggleIndicateurAssociation(indicateur: Indicateur, checked: boolean): void {
    const projet = this.projet();
    if (!projet) return;
    if (!this.canManageIndicateurs()) {
      this.showToast('Les indicateurs ne peuvent etre saisis que pour un projet en execution.', 'error');
      return;
    }

    this.associatingIndicateur.set(true);
    const request = checked
      ? this.projetsService.addIndicateurs(projet.id, [indicateur.id])
      : this.projetsService.removeIndicateurs(projet.id, [indicateur.id]);

    request.subscribe({
      next: () => {
        this.associatingIndicateur.set(false);
        this.showToast(checked ? 'Indicateur lie au projet' : 'Indicateur retire du projet', 'success');
        this.loadIndicateurs(projet.id);
      },
      error: (err) => {
        this.associatingIndicateur.set(false);
        this.showToast(err?.error?.message || err?.message || 'Erreur lors de la mise a jour de l\'indicateur', 'error');
      }
    });
  }

  saveIndicateurValeurActuelle(indicateur: Indicateur): void {
    const projet = this.projet();
    if (!projet) return;
    if (!this.canManageIndicateurs()) {
      this.showToast('Les indicateurs ne peuvent etre saisis que pour un projet en execution.', 'error');
      return;
    }

    this.savingValeurIndicateurId.set(indicateur.id);
    this.indicateursService.update(indicateur.id, {
      code: indicateur.code,
      nom: indicateur.nom,
      description: indicateur.description,
      typeIndicateur: indicateur.typeIndicateur,
      unite: indicateur.unite,
      valeurReference: indicateur.valeurReference,
      valeurCible: indicateur.valeurCible,
      valeurActuelle: this.indicateurValeursActuelles[indicateur.id] ?? undefined,
      frequenceMesure: indicateur.frequenceMesure,
      sourceVerification: indicateur.sourceVerification,
      periodicite: indicateur.periodicite,
      actif: indicateur.actif
    }).subscribe({
      next: () => {
        this.savingValeurIndicateurId.set(null);
        this.showToast('Valeur actuelle de l\'indicateur enregistree', 'success');
        this.loadIndicateurs(projet.id);
      },
      error: (err) => {
        this.savingValeurIndicateurId.set(null);
        this.showToast(err?.error?.message || err?.message || 'Erreur lors de l\'enregistrement de la valeur actuelle', 'error');
      }
    });
  }

  openDecaissementForm(): void {
    this.decaissementForm = {
      dateDecaissement: '',
      montant: null,
      referencePiece: '',
      commentaire: '',
    };
    this.showDecaissementForm.set(true);
  }

  cancelDecaissementForm(): void {
    this.showDecaissementForm.set(false);
  }

  saveDecaissement(): void {
    const projet = this.projet();
    const cp = this.selectedCp();
    if (!projet || !cp || !this.canCreateDecaissement()) return;

    this.savingDecaissement.set(true);
    const payload: Partial<Decaissement> = {
      creditPaiementId: cp.id,
      dateDecaissement: this.decaissementForm.dateDecaissement ? new Date(this.toIso(this.decaissementForm.dateDecaissement)) : undefined,
      montant: this.decaissementForm.montant ?? 0,
      referencePiece: this.decaissementForm.referencePiece || undefined,
      commentaire: this.decaissementForm.commentaire || undefined,
    };

    this.decaissementService.create(payload).subscribe({
      next: () => {
        this.savingDecaissement.set(false);
        this.showDecaissementForm.set(false);
        this.showToast('Décaissement créé', 'success');
        this.refreshAfterDecaissement(projet.id, cp.id);
      },
      error: (err) => {
        this.savingDecaissement.set(false);
        this.showToast(
          err?.error?.message || err?.message || 'Erreur lors de la création du décaissement',
          'error'
        );
      }
    });
  }

  activateDecaissement(): void {
    const projet = this.projet();
    if (!projet) return;

    this.projetsService.update(projet.id, { decaissementActif: true }).subscribe({
      next: (updated) => {
        this.projet.set(this.adaptProjetDates(updated));
        this.showToast('Décaissement activé', 'success');
      },
      error: (err) => {
        this.showToast(err?.message || 'Erreur lors de l\'activation du décaissement', 'error');
      }
    });
  }

  passerEnExecution(): void {
    const projet = this.projet();
    if (!projet || this.isProjetEnExecution()) return;

    this.switchingToExecution.set(true);
    this.projetsService.update(projet.id, { statut: 'EN_EXECUTION' }).subscribe({
      next: (updated) => {
        const adapted = this.adaptProjetDates(updated);
        this.projet.set(adapted);
        this.switchingToExecution.set(false);
        this.showToast('Projet passe en execution', 'success');
      },
      error: (err) => {
        this.switchingToExecution.set(false);
        this.showToast(err?.message || 'Erreur lors du passage en execution', 'error');
      }
    });
  }

  private refreshAfterDecaissement(projetId: string, creditPaiementId: string): void {
    const ae = this.selectedAe();
    if (ae) {
      this.loadCps(ae.id);
    } else {
      this.cpService.getByProjet(projetId).subscribe();
    }
    this.loadDecaissements(creditPaiementId);
    this.suiviExecutionService.getAll({ projetId }).subscribe();
  }

  isProjetEnExecution(): boolean {
    const projet = this.selectedCpProjet() ?? this.projet();
    if (!projet) return false;
    return projet.statut === 'EN_EXECUTION';
  }

  canCreateDecaissement(): boolean {
    const projet = this.selectedCpProjet() ?? this.projet();
    return !!projet && this.isProjetEnExecution() && projet.decaissementActif === true;
  }

  canActivateDecaissement(): boolean {
    const projet = this.selectedCpProjet() ?? this.projet();
    return !!projet && this.isProjetEnExecution() && projet.decaissementActif !== true;
  }

  canManageIndicateurs(): boolean {
    const projet = this.projet();
    return !!projet && projet.statut === 'EN_EXECUTION';
  }

  getIndicateursMessage(): string {
    if (this.canManageIndicateurs()) {
      return 'Vous pouvez associer des indicateurs et saisir leur valeur actuelle.';
    }
    return 'Les indicateurs ne peuvent etre saisis que pour un projet en execution.';
  }

  getIndicateurProgress(indicateur: Indicateur): number {
    if (!indicateur.valeurCible || !this.indicateurValeursActuelles[indicateur.id]) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(((this.indicateurValeursActuelles[indicateur.id] ?? 0) / indicateur.valeurCible) * 100)));
  }

  getIndicateurEvolution(indicateur: Indicateur): string {
    const valeurActuelle = this.indicateurValeursActuelles[indicateur.id];
    const unite = indicateur.unite ? ` ${indicateur.unite}` : '';
    if (valeurActuelle == null || indicateur.valeurCible == null) {
      return `-`;
    }
    const ecart = valeurActuelle - indicateur.valeurCible;
    const signe = ecart > 0 ? '+' : '';
    const pourcentage = indicateur.valeurCible === 0 ? 0 : Math.round((valeurActuelle / indicateur.valeurCible) * 100);
    return `${signe}${ecart}${unite} (${pourcentage}%)`;
  }

  formatIndicateurValeur(valeur: number | null | undefined, unite?: string): string {
    if (valeur == null) return '-';
    return `${valeur}${unite ? ` ${unite}` : ''}`;
  }

  getDecaissementMessage(): string {
    const projet = this.selectedCpProjet() ?? this.projet();
    if (!projet) return '';
    if (!this.isProjetEnExecution()) {
      return 'Décaissement non autorisé : le projet n’est pas en exécution.';
    }
    if (projet.decaissementActif !== true) {
      return 'Décaissement désactivé. Activez-le d’abord.';
    }
    return '';
  }

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
