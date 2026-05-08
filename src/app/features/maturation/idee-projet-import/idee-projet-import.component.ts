import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IdeeProjetImportInfosGeneralesPayload,
  IdeeProjetImportResult,
  IdeeProjetImportRowResult,
  Ministere,
  Secteur,
  StatutIdeeProjet
} from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { IdeeProjetImportService } from '@core/services/idee-projet-import.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

type ImportTab = 'infos-generales' | 'note-conceptuelle';

type ImportInfosGeneralesFormValue = {
  secteurId: string;
  portee: string;
  ministereTutelleFinanciereId: string;
  statut: string;
  actif: boolean | null;
};

@Component({
  selector: 'app-idee-projet-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './idee-projet-import.component.html',
  styleUrl: './idee-projet-import.component.scss'
})
export class IdeeProjetImportComponent implements OnInit {
  private readonly maxFileSizeBytes = 10 * 1024 * 1024;

  private authService = inject(AuthService);
  private importService = inject(IdeeProjetImportService);
  private secteursService = inject(SecteursService);
  private ministeresService = inject(MinisteresService);

  activeTab = signal<ImportTab>('infos-generales');
  selectedFile = signal<File | null>(null);
  importing = signal(false);
  importResult = signal<IdeeProjetImportResult | null>(null);
  showOnlyErrors = signal(false);
  secteurs = signal<Secteur[]>([]);
  ministeres = signal<Ministere[]>([]);

  infoGeneralesForm: ImportInfosGeneralesFormValue = this.createDefaultInfoGeneralesForm();

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  readonly acceptedExtensions = ['.csv', '.xls', '.xlsx'];

  readonly portees = [
    { value: 'NATIONALE', label: 'Nationale' },
    { value: 'REGIONALE', label: 'Regionale' },
    { value: 'PROVINCIALE', label: 'Provinciale' },
    { value: 'COMMUNALE', label: 'Communale' },
    { value: 'LOCALE', label: 'Locale' }
  ];

  readonly statuts: { value: StatutIdeeProjet; label: string }[] = [
    { value: 'IDEE_BROUILLON', label: 'Brouillon' },
    { value: 'IDEE_SOUMISE', label: 'Soumise' },
    { value: 'IDEE_SOMMAIRE_SELECTIONNEE', label: 'Sommaire selectionnee' },
    { value: 'IDEE_SOMMAIRE_REJETEE', label: 'Sommaire rejetee' },
    { value: 'IDEE_ARCHIVEE', label: 'Archivee' },
    { value: 'IDEE_CONCEPTION_BROUILLON', label: 'Conception brouillon' },
    { value: 'CONCEPTION_SOUMISE', label: 'Conception soumise' },
    { value: 'CONCEPTION_VALIDEE', label: 'Conception validee' },
    { value: 'RAPPORT_FAISABILITE_VALIDE', label: 'Faisabilite validee' },
    { value: 'PRODOC_SOUMIS', label: 'ProDoc soumis' },
    { value: 'PRODOC_VALIDE', label: 'ProDoc valide' },
    { value: 'AVIS_CNDP_FAVORABLE', label: 'Avis CNDP favorable' },
    { value: 'AVIS_CNDP_REJETE', label: 'Avis CNDP non favorable' },
    { value: 'IDENTIFICATION_FINANCEMENT', label: 'Financement identifie' },
    { value: 'SOUMISSION_DOSSIER_PROJET', label: 'Dossier projet soumis' },
    { value: 'DOSSIER_PROJET_VALIDE', label: 'Dossier projet valide' },
    { value: 'DOSSIER_PROJET_RETOURNE', label: 'Dossier projet retourne' }
  ];

  readonly visibleRows = computed(() => {
    const result = this.importResult();
    if (!result) {
      return [];
    }

    if (!this.showOnlyErrors()) {
      return result.rows;
    }

    return result.rows.filter(row => row.status === 'ERROR');
  });

  readonly infoGeneralesColumns = [
    'code',
    'titre',
    'description',
    'problematique',
    'objectifGeneral',
    'objectifsSpecifiques',
    'beneficiairesCibles',
    'beneficiairesEstimes',
    'zoneIntervention',
    'coutEstime',
    'modeFinancement',
    'dureeEstimeeMois',
    'porteurProjet',
    'pointFocalNom',
    'pointFocalEmail',
    'pointFocalTelephone',
    'dateSoumission'
  ];

  readonly noteConceptuelleColumns = [
    'ideeProjetId',
    'code',
    'contexte',
    'alignementStrategique',
    'resultatsAttendus',
    'indicateursPreliminaires',
    'descriptionSolution',
    'composantesProjet',
    'approcheMiseEnOeuvre',
    'contraintesRisques',
    'hypotheses',
    'prerequis',
    'modeFinancement',
    'chronogrammeSynthese',
    'impactSocioEconomique',
    'impactEnvironnementalSocial',
    'durabilite',
    'beneficiairesEstimes',
    'coutEstime',
    'dureeEstimeeMois'
  ];

  ngOnInit(): void {
    if (!this.canAccess()) {
      return;
    }

    this.loadSecteurs();
    this.loadMinisteres();
  }

  canAccess(): boolean {
    return !this.authService.hasRole(['INSTRUCTEUR', 'INSTRUCTEUR_DGESS', 'DGESS', 'CNDP', 'DGEP']);
  }

  isInfosGeneralesTab(): boolean {
    return this.activeTab() === 'infos-generales';
  }

  canImport(): boolean {
    if (this.importing() || !this.selectedFile()) {
      return false;
    }

    if (!this.isInfosGeneralesTab()) {
      return true;
    }

    return !!this.infoGeneralesForm.secteurId && !!this.infoGeneralesForm.portee;
  }

  setTab(tab: ImportTab): void {
    this.activeTab.set(tab);
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.showOnlyErrors.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    const validationError = this.validateFile(file);
    if (validationError) {
      this.selectedFile.set(null);
      if (input) {
        input.value = '';
      }
      this.showToast(validationError, 'error');
      return;
    }

    this.selectedFile.set(file);
  }

  clearFile(fileInput?: HTMLInputElement): void {
    this.selectedFile.set(null);
    if (fileInput) {
      fileInput.value = '';
    }
  }

  importFile(): void {
    const file = this.selectedFile();
    if (!file) {
      this.showToast('Selectionnez un fichier avant de lancer l\'import.', 'error');
      return;
    }

    const validationError = this.validateFile(file);
    if (validationError) {
      this.showToast(validationError, 'error');
      return;
    }

    if (this.isInfosGeneralesTab()) {
      const formError = this.validateInfoGeneralesForm();
      if (formError) {
        this.showToast(formError, 'error');
        return;
      }
    }

    const request$ = this.isInfosGeneralesTab()
      ? this.importService.importInfosGenerales(file, this.buildInfoGeneralesPayload())
      : this.importService.importNoteConceptuelle(file);

    this.importing.set(true);
    request$.subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importResult.set(result);
        this.showOnlyErrors.set(false);
        this.showToast('Import termine. Consultez le detail ci-dessous.', 'success');
      },
      error: () => {
        this.importing.set(false);
        this.showToast('Erreur lors de l\'import du fichier.', 'error');
      }
    });
  }

  downloadTemplate(): void {
    const headers = this.isInfosGeneralesTab()
      ? this.infoGeneralesColumns
      : this.noteConceptuelleColumns;

    const fileName = this.isInfosGeneralesTab()
      ? 'modele-import-idees-infos-generales.csv'
      : 'modele-import-idees-note-conceptuelle.csv';

    const csvContent = `${headers.join(';')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getHelpTitle(): string {
    return this.isInfosGeneralesTab()
      ? 'Import des informations generales'
      : 'Import des notes conceptuelles';
  }

  getHelpDescription(): string {
    return this.isInfosGeneralesTab()
      ? 'Le frontend envoie les champs communs du lot, puis le fichier apporte les donnees variables ligne par ligne.'
      : 'Le fichier doit contenir au minimum ideeProjetId ou code, puis les colonnes de la note conceptuelle.';
  }

  getCurrentColumns(): string[] {
    return this.isInfosGeneralesTab()
      ? this.infoGeneralesColumns
      : this.noteConceptuelleColumns;
  }

  getStatusBadgeClass(status: string): string {
    return status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
  }

  getStatusLabel(status: string): string {
    return status === 'SUCCESS' ? 'Succes' : 'Erreur';
  }

  getMinistereLabel(item: Ministere): string {
    return item.sigle || item.nom;
  }

  trackRow(_: number, row: IdeeProjetImportRowResult): string {
    return `${row.lineNumber}-${row.code ?? ''}-${row.status}`;
  }

  private createDefaultInfoGeneralesForm(): ImportInfosGeneralesFormValue {
    return {
      secteurId: '',
      portee: '',
      ministereTutelleFinanciereId: '',
      statut: '',
      actif: null
    };
  }

  private loadSecteurs(): void {
    this.secteursService.getAll().subscribe({
      next: (data) => this.secteurs.set(data),
      error: () => this.showToast('Impossible de charger la liste des secteurs.', 'error')
    });
  }

  private loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => this.showToast('Impossible de charger la liste des ministeres.', 'error')
    });
  }

  private validateInfoGeneralesForm(): string | null {
    if (!this.infoGeneralesForm.secteurId) {
      return 'Le secteur est obligatoire pour importer les informations generales.';
    }

    if (!this.infoGeneralesForm.portee) {
      return 'La portee est obligatoire pour importer les informations generales.';
    }

    return null;
  }

  private buildInfoGeneralesPayload(): IdeeProjetImportInfosGeneralesPayload {
    const payload: IdeeProjetImportInfosGeneralesPayload = {
      secteurId: this.infoGeneralesForm.secteurId,
      portee: this.infoGeneralesForm.portee
    };

    if (this.infoGeneralesForm.ministereTutelleFinanciereId) {
      payload.ministereTutelleFinanciereId = this.infoGeneralesForm.ministereTutelleFinanciereId;
    }

    if (this.infoGeneralesForm.statut) {
      payload.statut = this.infoGeneralesForm.statut;
    }

    if (this.infoGeneralesForm.actif !== null) {
      payload.actif = this.infoGeneralesForm.actif;
    }

    return payload;
  }

  private validateFile(file: File): string | null {
    if (file.size <= 0) {
      return 'Le fichier selectionne est vide.';
    }

    const extension = this.getFileExtension(file.name);
    if (!this.acceptedExtensions.includes(extension)) {
      return 'Format non autorise. Utilisez un fichier .csv, .xls ou .xlsx.';
    }

    if (file.size > this.maxFileSizeBytes) {
      return 'Le fichier depasse la taille maximale autorisee de 10 Mo.';
    }

    return null;
  }

  private getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
