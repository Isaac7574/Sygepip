import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ArbitrageProjetRequestDTO,
  AutorisationEngagement,
  CreditPaiement,
  Projet
} from '@core/models';
import { ArbitrageService } from '@core/services/arbitrage.service';
import { AutorisationEngagementService } from '@core/services/autorisation-engagement.service';
import { CreditPaiementService } from '@core/services/credit-paiement.service';
import { ProjetsService } from '@core/services/projets.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-arbitrage',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './arbitrage.component.html',
  styleUrl: './arbitrage.component.scss'
})
export class ArbitrageComponent implements OnInit {
  private arbitrageService = inject(ArbitrageService);
  private projetsService = inject(ProjetsService);
  private aeService = inject(AutorisationEngagementService);
  private cpService = inject(CreditPaiementService);

  projets = signal<Projet[]>([]);
  filteredProjets = signal<Projet[]>([]);
  autorisations = signal<AutorisationEngagement[]>([]);
  creditPaiements = signal<CreditPaiement[]>([]);
  selectedProjet = signal<Projet | null>(null);
  modalOpen = signal(false);
  loading = signal(false);
  loadingAes = signal(false);
  loadingCps = signal(false);
  saving = signal(false);
  searchTerm = '';

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  formData: ArbitrageProjetRequestDTO = this.resetForm();

  ngOnInit(): void {
    this.loadProjets();
  }

  private resetForm(projet?: Projet | null): ArbitrageProjetRequestDTO {
    return {
      coutTotal: projet?.coutTotal ?? undefined,
      autorisationEngagementId: undefined,
      montantAe: undefined,
      creditPaiementId: undefined,
      montantCp: undefined
    };
  }

  loadProjets(): void {
    this.loading.set(true);
    this.projetsService.getAll().subscribe({
      next: (data) => {
        const projets = data.filter(projet => this.isProjetEligibleForArbitrage(projet));
        this.projets.set(projets);
        this.filteredProjets.set(projets);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Erreur lors du chargement des projets à arbitrer', 'error');
      }
    });
  }

  private isProjetEligibleForArbitrage(projet: Projet): boolean {
    return this.normalizeStatut(projet.statut) === 'EN_ARBITRAGE';
  }

  private normalizeStatut(statut: string | undefined): string {
    return (statut || '').trim().toUpperCase();
  }

  search(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProjets.set(this.projets());
      return;
    }

    this.filteredProjets.set(
      this.projets().filter(projet =>
        projet.code.toLowerCase().includes(term) ||
        projet.titre.toLowerCase().includes(term)
      )
    );
  }

  openModal(projet: Projet): void {
    this.selectedProjet.set(projet);
    this.formData = this.resetForm(projet);
    this.autorisations.set([]);
    this.creditPaiements.set([]);
    this.modalOpen.set(true);
    this.loadAutorisations(projet.id);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedProjet.set(null);
    this.autorisations.set([]);
    this.creditPaiements.set([]);
    this.formData = this.resetForm();
  }

  loadAutorisations(projetId: string): void {
    this.loadingAes.set(true);
    this.aeService.getByProjet(projetId).subscribe({
      next: (data) => {
        this.autorisations.set(data);
        this.loadingAes.set(false);
      },
      error: () => {
        this.loadingAes.set(false);
        this.showToast('Erreur lors du chargement des AE du projet', 'error');
      }
    });
  }

  onAutorisationChange(): void {
    this.formData.montantAe = undefined;
    this.formData.creditPaiementId = undefined;
    this.formData.montantCp = undefined;
    this.creditPaiements.set([]);

    if (!this.formData.autorisationEngagementId) {
      return;
    }

    this.loadingCps.set(true);
      this.cpService.getByAutorisationEngagement(this.formData.autorisationEngagementId).subscribe({
      next: (data) => {
        this.creditPaiements.set(data);
        this.loadingCps.set(false);
      },
      error: () => {
        this.loadingCps.set(false);
        this.showToast('Erreur lors du chargement des CP lies a l\'AE', 'error');
      }
    });
  }

  onCreditPaiementChange(): void {
    this.formData.montantCp = undefined;
  }

  save(): void {
    const projet = this.selectedProjet();
    if (!projet) {
      return;
    }

    if (this.formData.autorisationEngagementId && this.formData.montantAe == null) {
      this.showToast('Le montant AE est obligatoire si une AE est sélectionnée', 'error');
      return;
    }

    if (this.formData.creditPaiementId && this.formData.montantCp == null) {
      this.showToast('Le montant CP est obligatoire si un CP est sélectionné', 'error');
      return;
    }

    this.saving.set(true);
    this.arbitrageService.arbitrerProjet(projet.id, this.buildPayload()).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.replaceProjet(response.projet);
        this.closeModal();
        this.showToast('Arbitrage enregistré avec succès', 'success');
      },
      error: (error: HttpErrorResponse | Error) => {
        this.saving.set(false);
        this.showToast(this.getErrorMessage(error), 'error');
      }
    });
  }

  private buildPayload(): ArbitrageProjetRequestDTO {
    return {
      coutTotal: this.formData.coutTotal ?? undefined,
      autorisationEngagementId: this.formData.autorisationEngagementId || undefined,
      montantAe: this.formData.montantAe ?? undefined,
      creditPaiementId: this.formData.creditPaiementId || undefined,
      montantCp: this.formData.montantCp ?? undefined
    };
  }

  private replaceProjet(updatedProjet: Projet): void {
    const projets = this.projets().map(projet => projet.id === updatedProjet.id ? updatedProjet : projet);
    this.projets.set(projets);
    this.search();
  }

  private getErrorMessage(error: HttpErrorResponse | Error): string {
    const status = (error as HttpErrorResponse).status;
    if (status === 400) {
      return 'Requête invalide: vérifiez les montants AE/CP obligatoires.';
    }
    if (status === 403) {
      return 'Vous n\'avez pas les droits pour arbitrer ce projet.';
    }
    if (status === 404) {
      return 'Projet, AE ou CP introuvable.';
    }
    return error.message || 'Erreur lors de l’enregistrement de l’arbitrage';
  }

  getAutorisationLabel(ae: AutorisationEngagement): string {
    return `${ae.natureDepenseNom || ae.natureDepense || 'AE'} - ${this.formatMontant(ae.montantAe ?? ae.montantAE)}`;
  }

  getCreditPaiementLabel(cp: CreditPaiement): string {
    return `${cp.annee || '-'} - ${this.formatMontant(cp.montantCp)}`;
  }

  formatMontant(value: number | undefined): string {
    if (value == null) {
      return '-';
    }
    return `${value.toLocaleString('fr-FR')} FCFA`;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
