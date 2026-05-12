import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProjetsService } from '@core/services/projets.service';
import { AuthService } from '@core/services/auth.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { AutorisationEngagementService } from '@core/services/autorisation-engagement.service';
import { CreditPaiementService } from '@core/services/credit-paiement.service';
import { DecaissementService } from '@core/services/decaissement.service';
import { IndicateursService } from '@core/services/indicateurs.service';
import { PlanFinancementService } from '@core/services/plan-financement.service';
import { SourcesFinancementService } from '@core/services/sources-financement.service';
import { NatureDepenseService } from '@core/services/nature-depense.service';
import { SuiviExecutionService } from '@core/services/suivi-execution.service';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import {
  Projet, Ministere, Secteur, Region, Programme, IdeeProjet,
  AutorisationEngagement, CreditPaiement, SourceFinancement, NatureDepense,
  CategorieProjet, TypeProjetPip, StatutInscriptionPip, ModeFinancement, Decaissement, Indicateur,
  PlanFinancement, WorkflowNextAction
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
  private authService = inject(AuthService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);
  private ideesProjetService = inject(IdeesProjetService);
  private aeService = inject(AutorisationEngagementService);
  private cpService = inject(CreditPaiementService);
  private decaissementService = inject(DecaissementService);
  private indicateursService = inject(IndicateursService);
  private planFinancementService = inject(PlanFinancementService);
  private sourcesFinancementService = inject(SourcesFinancementService);
  private natureDepenseService = inject(NatureDepenseService);
  private suiviExecutionService = inject(SuiviExecutionService);
  private workflowService = inject(WorkflowService);

  //  Etat principal 
  projet = signal<Projet | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<ActiveTab>('general');
  availableActions = signal<WorkflowNextAction[]>([]);
  loadingSelection = signal(false);
  validatingFinancial = signal(false);
  passingToArbitrage = signal(false);
  processingArbitrage = signal(false);
  validatingPip = signal(false);
  selectionComment = 'Projet retenu comme projet structurant';

  //  Referentiels 
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  sourcesFinancement = signal<SourceFinancement[]>([]);
  naturesDepense = signal<NatureDepense[]>([]);

  //  Programmation technique 
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
  validatingPT = signal(false);

  //  AE 
  aes = signal<AutorisationEngagement[]>([]);
  loadingAes = signal(false);
  selectedAe = signal<AutorisationEngagement | null>(null);
  showAeForm = signal(false);
  savingAe = signal(false);
  editingAeId = signal<string | null>(null);
  aeForm = {
    annee: null as number | null,
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

  //  CP 
  cps = signal<CreditPaiement[]>([]);
  loadingCps = signal(false);
  showCpForm = signal(false);
  savingCp = signal(false);
  editingCpId = signal<string | null>(null);
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

  planFinancements = signal<PlanFinancement[]>([]);
  loadingPlanFinancements = signal(false);
  savingPlanFinancement = signal(false);
  editingPlanFinancementId = signal<string | null>(null);
  showPlanFinancementForm = signal(false);
  planFinancementForm = {
    sourceFinancementId: '',
    montant: null as number | null,
    pourcentage: null as number | null,
    statut: '',
    dateEngagement: '',
    actif: true,
  };

  //  Decaissement 
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

  //  Toast 
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  //  Listes d'options 
  categoriesPip: { value: CategorieProjet; label: string }[] = [
    { value: 'CATEGORIE_1_ADMINISTRATION_DIRECTE', label: 'Categorie 1 - Administration directe' },
    { value: 'CATEGORIE_2_STRUCTURE_AUTONOME',     label: 'Categorie 2 - Structure autonome' },
    { value: 'CATEGORIE_3_AGENCES_PTF_ONG',        label: 'Categorie 3 - Agences / PTF / ONG' },
    { value: 'CATEGORIE_4_PPP',                    label: 'Categorie 4 - PPP' },
  ];

  typesProjetPip: { value: TypeProjetPip; label: string }[] = [
    { value: 'NOYAU_SUR', label: 'Noyau sur' },
    { value: 'NATIONAL',  label: 'National' },
  ];

  statutsInscriptionPip: { value: StatutInscriptionPip; label: string }[] = [
    { value: 'EN_EXECUTION',      label: 'En execution' },
    { value: 'INSTANCE_DEMARRAGE', label: 'Instance de demarrage' },
  ];

  modesFinancement: { value: ModeFinancement; label: string }[] = [
    { value: 'CONTREPARTIE', label: 'Contrepartie' },
    { value: 'SUBVENTION',   label: 'Subvention' },
    { value: 'PRET',         label: 'Pret' },
  ];

  statuts = [
    { value: 'PLANIFIE', label: 'Planifie' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'TERMINE',  label: 'Termine' },
    { value: 'ANNULE',   label: 'Annule' }
  ];

  categories = [
    { value: 'NOUVEAU',       label: 'Nouveau' },
    { value: 'EN_COURS',      label: 'En cours' },
    { value: 'EXTENSION',     label: 'Extension' },
    { value: 'REHABILITATION', label: 'Rehabilitation' }
  ];

  //  Lifecycle 
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

  //  Chargement 
  private loadProjet(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.projetsService.getById(id).subscribe({
      next: (data) => {
        const p = this.adaptProjetDates(data);
        if (!this.canAccessProjet(p)) {
          this.projet.set(null);
          this.error.set('Vous n avez acces qu aux projets de votre ministere.');
          this.loading.set(false);
          this.showToast('Acces refuse a ce projet.', 'error');
          return;
        }
        this.projet.set(p);
        this.loading.set(false);
        this.initPtForm(p);
        this.loadIndicateurs(p.id);
        this.loadAvailableActions(p.statut, () => {
          if (this.showFinanciereSection()) {
            this.loadAes(p.id);
            this.loadPlanFinancements(p.id);
          } else {
            this.clearFinancialData();
          }
          this.ensureActiveTabVisible();
        });
      },
      error: () => {
        this.error.set('Erreur lors du chargement du projet.');
        this.loading.set(false);
      }
    });
  }

  private loadAvailableActions(statut?: string, afterLoad?: () => void): void {
    if (!statut) {
      this.availableActions.set([]);
      this.logArbitrageDebugContext(statut, []);
      afterLoad?.();
      return;
    }

    this.workflowService.getMyActions('PROJET', statut).subscribe({
      next: (actions) => {
        this.availableActions.set(actions);
        this.logArbitrageDebugContext(statut, actions);
        afterLoad?.();
      },
      error: (error) => {
        this.availableActions.set([]);
        console.error('[ProjetDetail][Arbitrage] Echec chargement actions workflow', {
          projetId: this.projet()?.id,
          statut,
          error
        });
        this.logArbitrageDebugContext(statut, []);
        afterLoad?.();
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

  private loadPlanFinancements(projetId: string): void {
    this.loadingPlanFinancements.set(true);
    this.planFinancementService.getByProjet(projetId).subscribe({
      next: (data) => {
        this.planFinancements.set(data);
        this.loadingPlanFinancements.set(false);
      },
      error: () => {
        this.planFinancements.set([]);
        this.loadingPlanFinancements.set(false);
      }
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

  isInstructeur(): boolean {
    return this.authService.hasRole('INSTRUCTEUR');
  }

  private canAccessProjet(projet: Projet): boolean {
    if (!this.authService.hasRole(['INSTRUCTEUR', 'INSTRUCTEUR_DGESS', 'DGESS'])) {
      return true;
    }

    const currentMinistereId = this.authService.currentUser()?.ministereId;
    if (!currentMinistereId || !projet.ministereId) {
      return false;
    }

    return String(currentMinistereId) === String(projet.ministereId);
  }

  isDgep(): boolean {
    return this.authService.hasRole('DGEP');
  }

  canSelectPip(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_SELECTION' ||
      action.etatCible === 'SELECTIONNE'
    );
  }

  canProgramTechnique(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_PROG_OPERATIONNELLE' ||
      action.etatCible === 'PROG_OPERATIONNELLE'
    );
  }

  canValidateFinanciere(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_PROG_FINANCIERE' ||
      action.etatCible === 'PROG_FINANCIERE_VALIDE'
    );
  }

  canPasserArbitrage(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_PASSAGE_ARBITRAGE' ||
      action.etatCible === 'EN_ARBITRAGE'
    );
  }

  canRetenirArbitrage(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_ARBITRAGE_RETENU' ||
      action.etatCible === 'ARBITRAGE_RETENU'
    );
  }

  canAjournerArbitrage(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_ARBITRAGE_AJOURNE' ||
      action.etatCible === 'ARBITRAGE_AJOURNE'
    );
  }

  canValiderInscriptionPip(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_VALIDATION_INSCRIPTION' ||
      action.etatCible === 'PIP_VALIDE'
    );
  }

  canPasserExecution(): boolean {
    return this.availableActions().some(action =>
      action.codeEtape === 'PIP_PASSAGE_EXECUTION' ||
      action.etatCible === 'EN_EXECUTION'
    );
  }

  showTechniqueSection(): boolean {
    return this.isInstructeur() && this.canProgramTechnique();
  }

  showSelectPipButton(): boolean {
    return this.isDgep() && this.canSelectPip();
  }

  showValidateFinanciereButton(): boolean {
    return this.isDgep() && this.canValidateFinanciere();
  }

  showPasserArbitrageButton(): boolean {
    return this.isDgep() && this.canPasserArbitrage();
  }

  private logArbitrageDebugContext(
    statut: string | undefined,
    actions: WorkflowNextAction[]
  ): void {
    const currentUser = this.authService.currentUser();
    const roles = currentUser?.roles ?? [];
    const isDgep = this.authService.hasRole('DGEP');
    const canPasserArbitrage = actions.some(action =>
      action.codeEtape === 'PIP_PASSAGE_ARBITRAGE' ||
      action.etatCible === 'EN_ARBITRAGE'
    );

    console.groupCollapsed('[ProjetDetail][Arbitrage] Diagnostic affichage bouton');
    console.log('projetId:', this.projet()?.id);
    console.log('statutProjet:', statut);
    console.log('utilisateur:', currentUser?.username || currentUser?.email || '-');
    console.log('roles:', roles);
    console.log('isDgep:', isDgep);
    console.log('actionsWorkflow:', actions);
    console.log(
      'actionsArbitrageDetectees:',
      actions
        .filter(action =>
          action.codeEtape === 'PIP_PASSAGE_ARBITRAGE' ||
          action.etatCible === 'EN_ARBITRAGE'
        )
        .map(action => ({
          codeEtape: action.codeEtape,
          nomEtape: action.nomEtape,
          etatCible: action.etatCible,
          roleRequis: action.roleRequis
        }))
    );
    console.log('canPasserArbitrage:', canPasserArbitrage);
    console.log('showPasserArbitrageButton:', isDgep && canPasserArbitrage);
    console.groupEnd();
  }

  showRetenirArbitrageButton(): boolean {
    return this.isDgep() && this.canRetenirArbitrage();
  }

  showAjournerArbitrageButton(): boolean {
    return this.isDgep() && this.canAjournerArbitrage();
  }

  showValiderInscriptionPipButton(): boolean {
    return this.isDgep() && this.canValiderInscriptionPip();
  }

  showFinanciereSection(): boolean {
    const statut = this.projet()?.statut;
    return this.isDgep() && (
      this.canValidateFinanciere() ||
      this.canPasserArbitrage() ||
      statut === 'PROG_OPERATIONNELLE' ||
      statut === 'PROG_FINANCIERE_VALIDE' ||
      statut === 'PROG_FINANCIERE' ||
      statut === 'EN_EXECUTION'
    );
  }

  showArbitrageSection(): boolean {
    const statut = this.projet()?.statut;
    return (
      this.canRetenirArbitrage() ||
      this.canAjournerArbitrage() ||
      this.canValiderInscriptionPip() ||
      statut === 'EN_ARBITRAGE' ||
      statut === 'ARBITRAGE_RETENU' ||
      statut === 'ARBITRAGE_AJOURNE' ||
      statut === 'PIP_VALIDE'
    );
  }

  getWorkflowStatusMessage(): string {
    const statut = this.projet()?.statut;
    if (statut === 'MATURE') {
      return 'Projet mature en attente de selection par la DGEP.';
    }
    if (statut === 'SELECTIONNE') {
      return 'Projet selectionne. La programmation technique peut etre renseignee par l\'instructeur.';
    }
    if (statut === 'PROG_OPERATIONNELLE') {
      return 'La programmation technique est validee. La DGEP peut finaliser la programmation financiere.';
    }
    if (statut === 'PROG_FINANCIERE_VALIDE' || statut === 'PROG_FINANCIERE') {
      return 'La programmation financiere est validee. Le projet peut maintenant etre transmis a l\'arbitrage.';
    }
    if (statut === 'EN_ARBITRAGE') {
      return 'Le projet est en cours d\'arbitrage.';
    }
    if (statut === 'ARBITRAGE_RETENU') {
      return 'Le projet a ete retenu apres arbitrage. Il peut etre inscrit au PIP.';
    }
    if (statut === 'ARBITRAGE_AJOURNE') {
      return 'Le projet a ete ajourne apres arbitrage.';
    }
    if (statut === 'PIP_VALIDE') {
      return 'Le projet est inscrit au PIP. Il peut maintenant etre mis en execution.';
    }
    if (statut === 'EN_EXECUTION') {
      return this.projet()?.decaissementActif === true
        ? 'Le projet est en execution et le decaissement est active.'
        : 'Le projet est en execution. Le decaissement peut etre active.';
    }
    return 'Les actions disponibles sur ce projet sont pilotees par le workflow courant.';
  }

  getFinancialSectionMessage(): string {
    const statut = this.projet()?.statut;
    if (statut === 'PROG_OPERATIONNELLE') {
      return 'Renseignez les AE, les CP et le plan de financement, puis validez la programmation financiere.';
    }
    if (statut === 'PROG_FINANCIERE_VALIDE' || statut === 'PROG_FINANCIERE') {
      return 'La programmation financiere est validee. Vous pouvez maintenant transmettre le projet a l\'arbitrage.';
    }
    if (statut === 'EN_EXECUTION' && this.projet()?.decaissementActif === true) {
      return 'Le projet est en execution. Selectionnez une AE puis un CP pour enregistrer des operations de decaissement.';
    }
    if (statut === 'EN_EXECUTION') {
      return 'Le projet est en execution. Selectionnez une AE puis un CP pour preparer les operations de decaissement.';
    }
    return 'Le bloc financier reste pilote par les actions disponibles du workflow.';
  }

  getArbitrageSectionMessage(): string {
    const statut = this.projet()?.statut;
    if (statut === 'EN_ARBITRAGE') {
      return 'Le projet est en cours d\'arbitrage.';
    }
    if (statut === 'ARBITRAGE_RETENU') {
      return 'Le projet a ete retenu apres arbitrage. Il peut etre inscrit au PIP.';
    }
    if (statut === 'ARBITRAGE_AJOURNE') {
      return 'Le projet a ete ajourne apres arbitrage.';
    }
    if (statut === 'PIP_VALIDE') {
      return 'Le projet est inscrit au PIP. Il peut maintenant etre mis en execution.';
    }
    if (statut === 'EN_EXECUTION' && this.projet()?.decaissementActif === true) {
      return 'Le projet est en execution et le decaissement est active.';
    }
    if (statut === 'EN_EXECUTION') {
      return 'Le projet est en execution. Le decaissement peut etre active.';
    }
    return 'Le bloc arbitrage reste pilote par les actions disponibles du workflow.';
  }

  showPasserEnExecutionButton(): boolean {
    const projet = this.projet();
    return !!projet && this.isDgep() && this.canPasserExecution() && projet.statut === 'PIP_VALIDE';
  }

  canActiverDecaissementProjet(): boolean {
    const projet = this.projet();
    return !!projet && projet.statut === 'EN_EXECUTION' && projet.decaissementActif !== true;
  }

  getExecutionSectionMessage(): string {
    const projet = this.projet();
    if (!projet) return '';
    if (projet.statut === 'PIP_VALIDE') {
      return 'Le projet est inscrit au PIP. Il peut maintenant etre mis en execution.';
    }
    if (projet.statut === 'EN_EXECUTION' && projet.decaissementActif === true) {
      return 'Le projet est en execution et le decaissement est active.';
    }
    if (projet.statut === 'EN_EXECUTION') {
      return 'Le projet est en execution. Le decaissement peut etre active.';
    }
    return '';
  }

  private ensureActiveTabVisible(): void {
    if (this.activeTab() === 'technique' && !this.showTechniqueSection()) {
      this.activeTab.set(this.showFinanciereSection() ? 'financier' : 'general');
      return;
    }

    if (this.activeTab() === 'financier' && !this.showFinanciereSection()) {
      this.activeTab.set(this.showTechniqueSection() ? 'technique' : 'general');
    }
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

  //  Initialisation formulaire PT 
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

  //  Sauvegarde PT 
  saveProgrammationTechnique(): void {
    const p = this.projet();
    if (!p) return;
    if (!this.showTechniqueSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation technique de ce projet.', 'error');
      return;
    }
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
        this.refreshProjetAndActions(p.id);
        this.showToast('Programmation technique enregistree', 'success');
      },
      error: (err) => {
        this.savingPT.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission d\'effectuer la programmation technique de ce projet.');
      }
    });
  }

  //  AE 
  validateProgrammationTechnique(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showTechniqueSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation technique de ce projet.', 'error');
      return;
    }

    this.validatingPT.set(true);
    this.projetsService.validerProgrammationTechnique(projet.id, {
      userId,
      commentaire: 'Programmation technique validee'
    }).subscribe({
      next: () => {
        this.validatingPT.set(false);
        this.refreshProjetAndActions(projet.id, true);
        this.showToast('Programmation technique validee', 'success');
      },
      error: (err) => {
        this.validatingPT.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission d\'effectuer la programmation technique de ce projet.');
      }
    });
  }

  selectPip(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showSelectPipButton()) {
      this.showToast('Vous n\'avez pas la permission de selectionner ce projet pour le PIP.', 'error');
      return;
    }

    this.loadingSelection.set(true);
    this.projetsService.selectionnerPip(projet.id, {
      userId,
      commentaire: this.selectionComment || 'Projet retenu comme projet structurant'
    }).subscribe({
      next: () => {
        this.loadingSelection.set(false);
        this.refreshProjetAndActions(projet.id);
        this.showToast('Projet selectionne pour le PIP', 'success');
      },
      error: (err) => {
        this.loadingSelection.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de selectionner ce projet pour le PIP.');
      }
    });
  }

  validateProgrammationFinanciere(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showValidateFinanciereButton()) {
      this.showToast('Vous n\'avez pas la permission de valider la programmation financiere de ce projet.', 'error');
      return;
    }

    this.validatingFinancial.set(true);
    this.projetsService.validerProgrammationFinanciere(projet.id, {
      userId,
      commentaire: 'Programmation financiere validee'
    }).subscribe({
      next: () => {
        this.validatingFinancial.set(false);
        this.refreshProjetAndActions(projet.id, true);
        this.showToast('Programmation financiere validee', 'success');
      },
      error: (err) => {
        this.validatingFinancial.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de valider la programmation financiere de ce projet.');
      }
    });
  }

  passerArbitrageProjet(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showPasserArbitrageButton()) {
      this.showToast('Vous n\'avez pas la permission de transmettre ce projet a l\'arbitrage.', 'error');
      return;
    }

    this.passingToArbitrage.set(true);
    this.projetsService.passerArbitrage(projet.id, {
      userId,
      commentaire: 'Projet transmis a l\'arbitrage'
    }).subscribe({
      next: () => {
        this.passingToArbitrage.set(false);
        this.refreshProjetAndActions(projet.id, true);
        this.showToast('Projet transmis a l\'arbitrage', 'success');
      },
      error: (err) => {
        this.passingToArbitrage.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de transmettre ce projet a l\'arbitrage.');
      }
    });
  }

  retenirProjet(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showRetenirArbitrageButton()) {
      this.showToast('Vous n\'avez pas la permission de retenir ce projet apres arbitrage.', 'error');
      return;
    }

    this.processingArbitrage.set(true);
    this.projetsService.retenirArbitrage(projet.id, {
      userId,
      commentaire: 'Projet retenu apres arbitrage'
    }).subscribe({
      next: () => {
        this.processingArbitrage.set(false);
        this.refreshProjetAndActions(projet.id);
        this.showToast('Projet retenu apres arbitrage', 'success');
      },
      error: (err) => {
        this.processingArbitrage.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de retenir ce projet apres arbitrage.');
      }
    });
  }

  ajournerProjet(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showAjournerArbitrageButton()) {
      this.showToast('Vous n\'avez pas la permission d\'ajourner ce projet apres arbitrage.', 'error');
      return;
    }

    this.processingArbitrage.set(true);
    this.projetsService.ajournerArbitrage(projet.id, {
      userId,
      commentaire: 'Projet ajourne apres arbitrage'
    }).subscribe({
      next: () => {
        this.processingArbitrage.set(false);
        this.refreshProjetAndActions(projet.id);
        this.showToast('Projet ajourne apres arbitrage', 'success');
      },
      error: (err) => {
        this.processingArbitrage.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission d\'ajourner ce projet apres arbitrage.');
      }
    });
  }

  validerPip(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.showValiderInscriptionPipButton()) {
      this.showToast('Vous n\'avez pas la permission de valider l\'inscription de ce projet au PIP.', 'error');
      return;
    }

    this.validatingPip.set(true);
    this.projetsService.validerInscriptionPip(projet.id, {
      userId,
      commentaire: 'Inscription au PIP validee'
    }).subscribe({
      next: () => {
        this.validatingPip.set(false);
        this.refreshProjetAndActions(projet.id);
        this.showToast('Inscription au PIP validee', 'success');
      },
      error: (err) => {
        this.validatingPip.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de valider l\'inscription de ce projet au PIP.');
      }
    });
  }

  openAeForm(): void {
    this.editingAeId.set(null);
    this.aeForm = { annee: null, montantAe: null, sourceFinancementId: '', modeFinancement: '',
      ligneBudgetaire: '', natureDepenseId: '', dateAutorisation: '',
      statut: '', observations: '', actif: true };
    this.showAeForm.set(true);
  }

  editAe(ae: AutorisationEngagement): void {
    this.editingAeId.set(ae.id);
    this.aeForm = {
      annee: ae.annee ?? null,
      montantAe: ae.montantAe ?? ae.montantAE ?? null,
      sourceFinancementId: ae.sourceFinancementId ?? '',
      modeFinancement: '' as ModeFinancement | '',
      ligneBudgetaire: ae.ligneBudgetaire ?? ae.lignebudgetaire ?? '',
      natureDepenseId: ae.natureDepenseId ?? '',
      dateAutorisation: ae.dateAutorisation ? this.toDatetimeLocal(ae.dateAutorisation) : '',
      statut: ae.statut ?? '',
      observations: ae.observations ?? '',
      actif: ae.actif ?? true,
    };
    this.showAeForm.set(true);
  }

  cancelAeForm(): void {
    this.showAeForm.set(false);
    this.editingAeId.set(null);
  }

  saveAe(): void {
    const p = this.projet();
    if (!p) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }
    this.savingAe.set(true);
    const payload: any = {
      annee: this.aeForm.annee ?? undefined,
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
    const editingAeId = this.editingAeId();
    const request = editingAeId
      ? this.aeService.update(editingAeId, payload)
      : this.aeService.createForProjet(p.id, payload);
    request.subscribe({
      next: () => {
        this.savingAe.set(false);
        this.showAeForm.set(false);
        this.editingAeId.set(null);
        this.showToast('Autorisation d\'engagement creee', 'success');
        this.refreshProjetAndActions(p.id, true);
      },
      error: (err) => {
        this.savingAe.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de la creation de l\'AE', 'error');
      }
    });
  }

  deleteAe(ae: AutorisationEngagement, event?: Event): void {
    event?.stopPropagation();
    const p = this.projet();
    if (!p) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }

    this.savingAe.set(true);
    this.aeService.delete(ae.id).subscribe({
      next: () => {
        this.savingAe.set(false);
        if (this.selectedAe()?.id === ae.id) {
          this.selectedAe.set(null);
          this.selectedCp.set(null);
          this.cps.set([]);
        }
        this.showToast('Autorisation d\'engagement supprimee', 'success');
        this.refreshProjetAndActions(p.id, true);
      },
      error: (err) => {
        this.savingAe.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de la suppression de l\'AE', 'error');
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

  //  CP 
  openCpForm(): void {
    this.editingCpId.set(null);
    this.cpForm = { annee: null, montantCp: null, natureDepenseId: '',
      montantPaye: null, dateEcheance: '', statut: '', actif: true };
    this.showCpForm.set(true);
  }

  editCp(cp: CreditPaiement, event?: Event): void {
    event?.stopPropagation();
    this.editingCpId.set(cp.id);
    this.cpForm = { annee: cp.annee ?? null, montantCp: cp.montantCp ?? null, natureDepenseId: cp.natureDepenseId ?? '',
      montantPaye: cp.montantPaye ?? null, dateEcheance: cp.dateEcheance ? this.toDatetimeLocal(cp.dateEcheance) : '', statut: cp.statut ?? '', actif: cp.actif ?? true };
    this.showCpForm.set(true);
  }

  cancelCpForm(): void {
    this.showCpForm.set(false);
    this.editingCpId.set(null);
  }

  saveCp(): void {
    const ae = this.selectedAe();
    if (!ae) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }
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
    const editingCpId = this.editingCpId();
    const request = editingCpId
      ? this.cpService.update(editingCpId, payload)
      : this.cpService.createForAe(ae.id, payload);
    request.subscribe({
      next: () => {
        this.savingCp.set(false);
        this.showCpForm.set(false);
        this.editingCpId.set(null);
        this.showToast('Credit de paiement cree', 'success');
        this.loadCps(ae.id);
      },
      error: (err) => {
        this.savingCp.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de la creation du CP', 'error');
      }
    });
  }

  //  Helpers date 
  deleteCp(cp: CreditPaiement, event?: Event): void {
    event?.stopPropagation();
    const ae = this.selectedAe();
    if (!ae) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }

    this.savingCp.set(true);
    this.cpService.delete(cp.id).subscribe({
      next: () => {
        this.savingCp.set(false);
        if (this.selectedCp()?.id === cp.id) {
          this.selectedCp.set(null);
          this.decaissements.set([]);
        }
        this.showToast('Credit de paiement supprime', 'success');
        this.loadCps(ae.id);
      },
      error: (err) => {
        this.savingCp.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de la suppression du CP', 'error');
      }
    });
  }

  selectCp(cp: CreditPaiement): void {
    this.selectedCp.set(cp);
    this.selectedCpProjet.set(null);
    this.showDecaissementForm.set(false);
    this.decaissements.set([]);
    this.loadDecaissements(cp.id);
    this.autoOpenDecaissementFormForSelectedCp();
    if (cp.projetId) {
      this.projetsService.getById(cp.projetId).subscribe({
        next: (projet) => {
          this.selectedCpProjet.set(this.adaptProjetDates(projet));
          this.autoOpenDecaissementFormForSelectedCp();
        },
        error: () => this.selectedCpProjet.set(null)
      });
    }
  }

  private autoOpenDecaissementFormForSelectedCp(): void {
    if (this.canCreateDecaissement()) {
      this.openDecaissementForm();
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
        this.showToast('Decaissement cree', 'success');
        this.refreshAfterDecaissement(projet.id, cp.id);
      },
      error: (err) => {
        this.savingDecaissement.set(false);
        this.showToast(
          err?.error?.message || err?.message || 'Erreur lors de la creation du decaissement',
          'error'
        );
      }
    });
  }

  activateDecaissement(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId) return;
    if (!this.canActiverDecaissementProjet()) {
      this.showToast('Vous n\'avez pas la permission d\'activer le decaissement pour ce projet.', 'error');
      return;
    }

    this.activatingDecaissement.set(true);
    this.projetsService.activerDecaissement(projet.id, {
      userId,
      commentaire: 'Decaissement active'
    }).subscribe({
      next: () => {
        this.activatingDecaissement.set(false);
        this.activeTab.set('financier');
        this.refreshProjetAndActions(projet.id, true);
        this.showToast('Decaissement active', 'success');
      },
      error: (err) => {
        this.activatingDecaissement.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission d\'activer le decaissement pour ce projet.');
      }
    });
  }

  passerEnExecution(): void {
    const projet = this.projet();
    const userId = this.authService.currentUser()?.id;
    if (!projet || !userId || this.isProjetEnExecution()) return;
    if (!this.showPasserEnExecutionButton()) {
      this.showToast('Vous n\'avez pas la permission de passer ce projet en execution.', 'error');
      return;
    }

    this.switchingToExecution.set(true);
    this.projetsService.passerExecution(projet.id, {
      userId,
      commentaire: 'Projet passe en execution'
    }).subscribe({
      next: () => {
        this.switchingToExecution.set(false);
        this.activeTab.set('financier');
        this.refreshProjetAndActions(projet.id, true);
        this.showToast('Projet passe en execution', 'success');
      },
      error: (err) => {
        this.switchingToExecution.set(false);
        this.showPermissionAwareError(err, 'Vous n\'avez pas la permission de passer ce projet en execution.');
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

  shouldDisplayDecaissementForm(): boolean {
    return !!this.selectedCp() && this.canCreateDecaissement();
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
    if (!this.selectedAe()) {
      return 'Selectionnez d abord une AE.';
    }
    if (!this.selectedCp()) {
      return 'Selectionnez ensuite un CP pour saisir un decaissement.';
    }
    if (!projet) return '';
    if (!this.isProjetEnExecution()) {
      return 'Decaissement non autorise : le projet nest pas en execution.';
    }
    if (projet.decaissementActif !== true) {
      return 'Decaissement desactive. Activez-le dabord.';
    }
    return '';
  }

  openPlanFinancementForm(): void {
    this.editingPlanFinancementId.set(null);
    this.planFinancementForm = {
      sourceFinancementId: '',
      montant: null,
      pourcentage: null,
      statut: '',
      dateEngagement: '',
      actif: true,
    };
    this.showPlanFinancementForm.set(true);
  }

  editPlanFinancement(line: PlanFinancement, event?: Event): void {
    event?.stopPropagation();
    this.editingPlanFinancementId.set(line.id);
    this.planFinancementForm = {
      sourceFinancementId: line.sourceFinancementId ?? '',
      montant: line.montant ?? null,
      pourcentage: line.pourcentage ?? null,
      statut: line.statut ?? '',
      dateEngagement: line.dateEngagement ? this.toDatetimeLocal(line.dateEngagement) : '',
      actif: line.actif ?? true,
    };
    this.showPlanFinancementForm.set(true);
  }

  cancelPlanFinancementForm(): void {
    this.showPlanFinancementForm.set(false);
    this.editingPlanFinancementId.set(null);
  }

  savePlanFinancement(): void {
    const projet = this.projet();
    if (!projet) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }

    this.savingPlanFinancement.set(true);
    const payload: Partial<PlanFinancement> = {
      projetId: projet.id,
      sourceFinancementId: this.planFinancementForm.sourceFinancementId || undefined,
      montant: this.planFinancementForm.montant ?? undefined,
      pourcentage: this.planFinancementForm.pourcentage ?? undefined,
      statut: this.planFinancementForm.statut || undefined,
      dateEngagement: this.planFinancementForm.dateEngagement ? new Date(this.toIso(this.planFinancementForm.dateEngagement)) : undefined,
      actif: this.planFinancementForm.actif,
    };
    const editingPlanFinancementId = this.editingPlanFinancementId();
    const request = editingPlanFinancementId
      ? this.planFinancementService.update(editingPlanFinancementId, payload)
      : this.planFinancementService.create(payload);

    request.subscribe({
      next: () => {
        this.savingPlanFinancement.set(false);
        this.showPlanFinancementForm.set(false);
        this.editingPlanFinancementId.set(null);
        this.showToast('Plan de financement enregistre', 'success');
        this.refreshProjetAndActions(projet.id, true);
      },
      error: (err) => {
        this.savingPlanFinancement.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de l\'enregistrement du plan de financement', 'error');
      }
    });
  }

  deletePlanFinancement(line: PlanFinancement, event?: Event): void {
    event?.stopPropagation();
    const projet = this.projet();
    if (!projet) return;
    if (!this.showFinanciereSection()) {
      this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
      return;
    }

    this.savingPlanFinancement.set(true);
    this.planFinancementService.delete(line.id).subscribe({
      next: () => {
        this.savingPlanFinancement.set(false);
        this.showToast('Plan de financement supprime', 'success');
        this.refreshProjetAndActions(projet.id, true);
      },
      error: (err) => {
        this.savingPlanFinancement.set(false);
        if (err?.status === 403) {
          this.showToast('Vous n\'avez pas la permission d\'effectuer la programmation financiere de ce projet.', 'error');
          return;
        }
        this.showToast(err?.message || 'Erreur lors de la suppression du plan de financement', 'error');
      }
    });
  }

  private refreshProjetAndActions(id: string, reloadFinance = false): void {
    this.projetsService.getById(id).subscribe({
      next: (data) => {
        const projet = this.adaptProjetDates(data);
        this.projet.set(projet);
        this.initPtForm(projet);
        this.loadAvailableActions(projet.statut, () => {
          if (reloadFinance) {
            if (this.showFinanciereSection()) {
              this.loadAes(projet.id);
              this.loadPlanFinancements(projet.id);
            } else {
              this.clearFinancialData();
            }
          }
          this.ensureActiveTabVisible();
        });
      }
    });
  }

  private clearFinancialData(): void {
    this.aes.set([]);
    this.planFinancements.set([]);
    this.selectedAe.set(null);
    this.selectedCp.set(null);
    this.selectedCpProjet.set(null);
    this.cps.set([]);
    this.decaissements.set([]);
  }

  private showPermissionAwareError(err: any, forbiddenMessage: string): void {
    if (err?.status === 403) {
      this.showToast(forbiddenMessage, 'error');
      return;
    }
    this.showToast(err?.message || 'Erreur lors du traitement de la requete', 'error');
  }

  private toIso(datetimeLocal: string): string {
    // datetime-local gives YYYY-MM-DDTHH:mm  backend wants YYYY-MM-DDTHH:mm:ss
    return datetimeLocal.length === 16 ? datetimeLocal + ':00' : datetimeLocal;
  }

  private toDatetimeLocal(date: Date | string): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  //  Adapt / Format 
  private adaptProjetDates(projet: any): Projet {
    return {
      ...projet,
      dateDebutPrevu: projet.dateDebutPrevu ? new Date(projet.dateDebutPrevu) : undefined,
      dateFinPrevu:   projet.dateFinPrevu   ? new Date(projet.dateFinPrevu)   : undefined,
      createdAt:    projet.createdAt    ? new Date(projet.createdAt)    : new Date(),
      dateCreation: projet.dateCreation ? new Date(projet.dateCreation) : new Date(),
      statut:    projet.statut    || 'MATURE',
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
    return p ? (p.code + '  ' + p.nom) : '-';
  }

  getIdeeProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? (ip.code + '  ' + ip.titre) : '-';
  }

  getSourceFinancementNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.sourcesFinancement().find(s => String(s.id) === String(id));
    return s ? (s.code + '  ' + s.nom) : '-';
  }

  getNatureDepenseNom(id: string | number | undefined): string {
    if (!id) return '-';
    const n = this.naturesDepense().find(n => String(n.id) === String(id));
    return n ? (n.code + '  ' + n.nom) : '-';
  }

  getCategorieLabel(value: string | undefined): string {
    if (!value) return '-';
    return this.categories.find(c => c.value === value)?.label || value;
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    const workflowLabels: Record<string, string> = {
      'MATURE': 'Mature',
      'SELECTIONNE': 'Selectionne',
      'PROG_OPERATIONNELLE': 'Programmation technique finalisee',
      'PROG_FINANCIERE': 'Programmation financiere validee',
      'PROG_FINANCIERE_VALIDE': 'Programmation financiere validee',
      'EN_ARBITRAGE': 'En arbitrage',
      'ARBITRAGE_RETENU': 'Arbitrage retenu',
      'ARBITRAGE_AJOURNE': 'Arbitrage ajourne',
      'PIP_VALIDE': 'Inscrit au PIP',
      'EN_EXECUTION': 'En execution'
    };
    return workflowLabels[statut] || this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'MATURE': 'badge-info',
      'SELECTIONNE': 'badge-warning',
      'PROG_OPERATIONNELLE': 'badge-primary',
      'PROG_FINANCIERE': 'badge-success',
      'PROG_FINANCIERE_VALIDE': 'badge-success',
      'EN_ARBITRAGE': 'badge-warning',
      'ARBITRAGE_RETENU': 'badge-success',
      'ARBITRAGE_AJOURNE': 'badge-warning',
      'PIP_VALIDE': 'badge-primary',
      'EN_EXECUTION': 'badge-success',
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
