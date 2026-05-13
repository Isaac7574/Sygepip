import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IdeeProjetImportInfosGeneralesPayload,
  IdeeProjetImportResult,
  IdeeProjetImportRowResult,
  Ministere,
  ModeFinancement,
  Secteur,
  StatutIdeeProjet
} from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { IdeeProjetImportService } from '@core/services/idee-projet-import.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

type ImportInfosGeneralesFormValue = {
  secteurId: string;
  portee: string;
  modeFinancement: ModeFinancement | '';
  ministereTutelleFinanciereId: string;
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

  readonly modesFinancement: { value: ModeFinancement; label: string }[] = [
    { value: 'CONTREPARTIE', label: 'Contrepartie' },
    { value: 'SUBVENTION', label: 'Subvention' },
    { value: 'PRET', label: 'Pret' }
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
    'beneficiairesEstimes',
    'pointFocalNom',
    'pointFocalEmail',
    'pointFocalTelephone'
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
    return true;
  }

  canImport(): boolean {
    if (this.importing() || !this.selectedFile()) {
      return false;
    }

    return !!this.infoGeneralesForm.secteurId && !!this.infoGeneralesForm.portee && !!this.infoGeneralesForm.modeFinancement;
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

    const formError = this.validateInfoGeneralesForm();
    if (formError) {
      this.showToast(formError, 'error');
      return;
    }

    this.importing.set(true);
    this.importService.importInfosGenerales(file, this.buildInfoGeneralesPayload()).subscribe({
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
    const csvContent = `${this.infoGeneralesColumns.join(';')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-import-idees-infos-generales.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getHelpTitle(): string {
    return 'Import des informations generales';
  }

  getHelpDescription(): string {
    return 'Le frontend envoie le secteur, la portee et le mode de financement souhaite, puis le fichier apporte les donnees variables ligne par ligne.';
  }

  getCurrentColumns(): string[] {
    return this.infoGeneralesColumns;
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
      modeFinancement: '',
      ministereTutelleFinanciereId: '',
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
      next: (data) => {
        this.ministeres.set(data);
        this.infoGeneralesForm.ministereTutelleFinanciereId = this.resolveMinistereTutelleFinanciereId(data);
      },
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

    if (!this.infoGeneralesForm.modeFinancement) {
      return 'Le mode de financement souhaite est obligatoire pour importer les informations generales.';
    }

    return null;
  }

  private buildInfoGeneralesPayload(): IdeeProjetImportInfosGeneralesPayload {
    const payload: IdeeProjetImportInfosGeneralesPayload = {
      secteurId: this.infoGeneralesForm.secteurId,
      portee: this.infoGeneralesForm.portee,
      statut: 'IDEE_BROUILLON' as StatutIdeeProjet,
      actif: true
    };

    if (this.infoGeneralesForm.modeFinancement) {
      payload.modeFinancement = this.infoGeneralesForm.modeFinancement;
    }

    if (this.infoGeneralesForm.ministereTutelleFinanciereId) {
      payload.ministereTutelleFinanciereId = this.infoGeneralesForm.ministereTutelleFinanciereId;
    }

    return payload;
  }

  private resolveMinistereTutelleFinanciereId(items: Ministere[]): string {
    const match = items.find((item) => {
      const label = `${item.sigle ?? ''} ${item.nom ?? ''}`.toLowerCase();
      return (
        label.includes('economie') && label.includes('finance')
      ) || label.includes('finances');
    });

    return match ? String(match.id) : '';
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
