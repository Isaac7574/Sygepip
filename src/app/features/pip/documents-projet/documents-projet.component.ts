import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DocumentProjetService } from '@core/services/document-projet.service';
import { ProjetsService } from '@core/services/projets.service';
import {
  DocumentProjetResponseDTO,
  Projet,
  TypeDocumentProjet
} from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-documents-projet',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './documents-projet.component.html',
  styleUrl: './documents-projet.component.scss'
})
export class DocumentsProjetComponent implements OnInit {
  private documentProjetService = inject(DocumentProjetService);
  private projetsService = inject(ProjetsService);

  items = signal<DocumentProjetResponseDTO[]>([]);
  filteredItems = signal<DocumentProjetResponseDTO[]>([]);
  projets = signal<Projet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  uploading = signal(false);

  selectedFile: File | null = null;
  selectedProjetId = '';
  selectedTypeDocument: TypeDocumentProjet | '' = '';

  versionsModalOpen = signal(false);
  versionsItems = signal<DocumentProjetResponseDTO[]>([]);
  versionsLoading = signal(false);

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: DocumentProjetResponseDTO | null = null;

  replaceDialogVisible = signal(false);
  replacementTarget: DocumentProjetResponseDTO | null = null;
  replaceErrorMessage = '';

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesDocument: { value: TypeDocumentProjet; label: string }[] = [
    { value: 'NOTE_CONCEPTUELLE', label: 'Note conceptuelle' },
    { value: 'ETUDE_FAISABILITE', label: 'Etude de faisabilite' },
    { value: 'RAPPORT_TECHNIQUE', label: 'Rapport technique' },
    { value: 'PLAN_FINANCEMENT', label: 'Plan de financement' },
    { value: 'CAHIER_CHARGES', label: 'Cahier des charges' },
    { value: 'RAPPORT_AVANCEMENT', label: 'Rapport d\'avancement' },
    { value: 'PV_RECEPTION', label: 'PV de reception' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.projetsService.getAll().subscribe({
      next: (data) => this.projets.set(data),
      error: () => this.showToast('Erreur lors du chargement des projets', 'error')
    });
  }

  loadDocumentsByProjet(projetId: string): void {
    if (!projetId) {
      this.items.set([]);
      this.filteredItems.set([]);
      return;
    }
    this.documentProjetService.getByProjet(projetId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.filteredItems.set(data);
      },
      error: () => this.showToast('Erreur lors du chargement des documents', 'error')
    });
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems.set(this.items());
      return;
    }

    this.documentProjetService.recherche(this.searchTerm).subscribe({
      next: (data) => this.filteredItems.set(data),
      error: () => {
        const term = this.searchTerm.toLowerCase();
        this.filteredItems.set(this.items().filter(i =>
          i.titre?.toLowerCase().includes(term) ||
          i.typeDocument?.toLowerCase().includes(term)
        ));
      }
    });
  }

  onProjetChange(): void {
    this.loadDocumentsByProjet(this.selectedProjetId);
  }

  openModal(): void {
    this.selectedFile = null;
    this.selectedTypeDocument = '';
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  upload(): void {
    if (!this.selectedFile || !this.selectedTypeDocument || !this.selectedProjetId) {
      this.showToast('Veuillez selectionner un projet, un type et un fichier', 'error');
      return;
    }

    const existingDocument = this.findExistingActiveDocument(this.selectedTypeDocument as TypeDocumentProjet);
    if (existingDocument) {
      this.replacementTarget = existingDocument;
      this.replaceErrorMessage = 'Un document actif du meme type existe deja. Voulez-vous le remplacer par une nouvelle version ?';
      this.replaceDialogVisible.set(true);
      return;
    }

    this.uploading.set(true);
    this.documentProjetService.upload(
      this.selectedFile,
      this.selectedTypeDocument as TypeDocumentProjet,
      this.selectedProjetId
    ).subscribe({
      next: () => {
        this.uploading.set(false);
        this.closeModal();
        this.loadDocumentsByProjet(this.selectedProjetId);
        this.showToast('Document uploade avec succes', 'success');
      },
      error: (error: HttpErrorResponse | Error) => {
        this.uploading.set(false);
        if (this.isDuplicateDocumentError(error) && existingDocument) {
          this.replacementTarget = existingDocument;
          this.replaceErrorMessage = this.extractErrorMessage(error);
          this.replaceDialogVisible.set(true);
          return;
        }
        this.showToast(this.extractErrorMessage(error), 'error');
      }
    });
  }

  confirmReplace(): void {
    if (!this.selectedFile || !this.replacementTarget) {
      return;
    }

    this.uploading.set(true);
    this.documentProjetService.uploadVersion(this.replacementTarget.id, this.selectedFile).subscribe({
      next: () => {
        this.uploading.set(false);
        this.cancelReplace();
        this.closeModal();
        this.loadDocumentsByProjet(this.selectedProjetId);
        this.showToast('Nouvelle version du document uploadee avec succes', 'success');
      },
      error: (error: HttpErrorResponse | Error) => {
        this.uploading.set(false);
        this.showToast(this.extractErrorMessage(error), 'error');
      }
    });
  }

  cancelReplace(): void {
    this.replaceDialogVisible.set(false);
    this.replacementTarget = null;
    this.replaceErrorMessage = '';
  }

  download(item: DocumentProjetResponseDTO): void {
    this.documentProjetService.downloadAndSave(item.id, item.titre);
  }

  showVersions(item: DocumentProjetResponseDTO): void {
    this.versionsLoading.set(true);
    this.versionsModalOpen.set(true);

    this.documentProjetService.getVersions(item.projetId, item.typeDocument).subscribe({
      next: (data) => {
        this.versionsItems.set(data);
        this.versionsLoading.set(false);
      },
      error: () => {
        this.versionsLoading.set(false);
        this.showToast('Erreur lors du chargement des versions', 'error');
      }
    });
  }

  closeVersionsModal(): void {
    this.versionsModalOpen.set(false);
    this.versionsItems.set([]);
  }

  confirmDelete(item: DocumentProjetResponseDTO): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le document';
    this.confirmDialogMessage = `Etes-vous sur de vouloir supprimer le document "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.documentProjetService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.loadDocumentsByProjet(this.selectedProjetId);
          this.showToast('Document supprime avec succes', 'success');
        },
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

  getProjetNom(id: string | undefined): string {
    if (!id) return '-';
    const projet = this.projets().find(p => String(p.id) === String(id));
    return projet ? `${projet.code} - ${projet.titre}` : '-';
  }

  getTypeDocumentLabel(type: TypeDocumentProjet): string {
    const found = this.typesDocument.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getDecisionBadgeClass(decision: string): string {
    switch (decision) {
      case 'ACCEPTE': return 'badge-success';
      case 'REFUSE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private findExistingActiveDocument(typeDocument: TypeDocumentProjet): DocumentProjetResponseDTO | null {
    return this.items().find(item => item.typeDocument === typeDocument && item.actif !== false) || null;
  }

  private isDuplicateDocumentError(error: HttpErrorResponse | Error): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    return message.includes('document actif') && message.includes('existe deja');
  }

  private extractErrorMessage(error: HttpErrorResponse | Error): string {
    const httpError = error as HttpErrorResponse;
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }
    if (httpError.error?.error) {
      return httpError.error.error;
    }
    if (httpError.error?.message) {
      return httpError.error.message;
    }
    if (httpError.error?.details) {
      return httpError.error.details;
    }
    return error.message || 'Une erreur est survenue';
  }
}
