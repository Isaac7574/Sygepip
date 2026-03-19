import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentIdeeService } from '@core/services/document-idee.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import {
  DocumentIdeeProjetResponseDTO,
  IdeeProjet,
  TypeDocumentProjet
} from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit {
  private documentIdeeService = inject(DocumentIdeeService);
  private ideesProjetService = inject(IdeesProjetService);
  private sanitizer = inject(DomSanitizer);

  items = signal<DocumentIdeeProjetResponseDTO[]>([]);
  filteredItems = signal<DocumentIdeeProjetResponseDTO[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  saving = signal(false);
  uploading = signal(false);

  selectedFile: File | null = null;
  selectedIdeeProjetId = '';
  selectedTypeDocument: TypeDocumentProjet | '' = '';

  versionsModalOpen = signal(false);
  versionsItems = signal<DocumentIdeeProjetResponseDTO[]>([]);
  versionsLoading = signal(false);

  viewModalOpen = signal(false);
  viewingItem = signal<DocumentIdeeProjetResponseDTO | null>(null);
  viewSafeUrl = signal<SafeResourceUrl | null>(null);
  viewRawUrl: string | null = null;
  viewLoading = signal(false);

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: DocumentIdeeProjetResponseDTO | null = null;

  replaceDialogVisible = signal(false);
  replacementTarget: DocumentIdeeProjetResponseDTO | null = null;
  replaceErrorMessage = '';

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesDocument: { value: TypeDocumentProjet; label: string }[] = [
    { value: 'NOTE_CONCEPTUELLE', label: 'Note conceptuelle' },
    { value: 'DEMANDE_CREATION_PROJET', label: 'Demande de creation de projet' },
    { value: 'ETUDE_FAISABILITE', label: 'Etude de faisabilite' },
    { value: 'RAPPORT_FAISABILITE', label: 'Rapport de faisabilite' },
    { value: 'PRODOC', label: 'ProDoc' },
    { value: 'ACTE_JURIDIQUE', label: 'Acte juridique' },
    { value: 'PROJET_ARRETE_CONJOINT', label: 'Projet arrete conjoint' },
    { value: 'PROTOCOLE_ACCORD_ETAT_PARTENAIRE', label: 'Protocole accord Etat partenaire' },
    { value: 'DOSSIER_PROJET', label: 'Dossier projet' },
    { value: 'RAPPORT_TECHNIQUE', label: 'Rapport technique' },
    { value: 'PLAN_FINANCEMENT', label: 'Plan de financement' },
    { value: 'CAHIER_CHARGES', label: 'Cahier des charges' },
    { value: 'RAPPORT_AVANCEMENT', label: 'Rapport d\'avancement' },
    { value: 'PV_RECEPTION', label: 'PV de reception' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.loadIdeesProjet();
  }

  loadIdeesProjet(): void {
    this.ideesProjetService.getAll().subscribe({
      next: (data) => this.ideesProjet.set(data),
      error: () => this.showToast('Erreur lors du chargement des idees projet', 'error')
    });
  }

  loadDocumentsByIdee(ideeProjetId: string): void {
    if (!ideeProjetId) {
      this.items.set([]);
      this.filteredItems.set([]);
      return;
    }
    this.documentIdeeService.getByIdeeProjet(ideeProjetId).subscribe({
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

    this.documentIdeeService.recherche(this.searchTerm).subscribe({
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

  onIdeeProjetChange(): void {
    this.loadDocumentsByIdee(this.selectedIdeeProjetId);
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
    if (!this.selectedFile || !this.selectedTypeDocument || !this.selectedIdeeProjetId) {
      this.showToast('Veuillez selectionner une idee projet, un type et un fichier', 'error');
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
    this.documentIdeeService.upload(
      this.selectedFile,
      this.selectedTypeDocument as TypeDocumentProjet,
      this.selectedIdeeProjetId
    ).subscribe({
      next: () => {
        this.uploading.set(false);
        this.closeModal();
        this.loadDocumentsByIdee(this.selectedIdeeProjetId);
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
    this.documentIdeeService.uploadVersion(this.replacementTarget.id, this.selectedFile).subscribe({
      next: () => {
        this.uploading.set(false);
        this.cancelReplace();
        this.closeModal();
        this.loadDocumentsByIdee(this.selectedIdeeProjetId);
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

  download(item: DocumentIdeeProjetResponseDTO): void {
    this.documentIdeeService.downloadAndSave(item.id, item.titre);
  }

  showVersions(item: DocumentIdeeProjetResponseDTO): void {
    this.versionsLoading.set(true);
    this.versionsModalOpen.set(true);

    this.documentIdeeService.getVersions(item.ideeProjetId, item.typeDocument).subscribe({
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

  viewFile(item: DocumentIdeeProjetResponseDTO): void {
    this.viewingItem.set(item);
    this.viewSafeUrl.set(null);
    this.viewRawUrl = null;
    this.viewLoading.set(true);
    this.viewModalOpen.set(true);

    this.documentIdeeService.download(item.id).subscribe({
      next: (blob) => {
        const mimeType = this.getMimeType(item.titre);
        const typedBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
        const url = window.URL.createObjectURL(typedBlob);
        this.viewRawUrl = url;
        this.viewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.viewLoading.set(false);
      },
      error: () => {
        this.viewLoading.set(false);
        this.showToast('Erreur lors du chargement du fichier', 'error');
      }
    });
  }

  getMimeType(titre: string): string {
    const ext = titre.split('.').pop()?.toLowerCase() ?? '';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeMap[ext] ?? '';
  }

  closeViewModal(): void {
    if (this.viewRawUrl) {
      window.URL.revokeObjectURL(this.viewRawUrl);
      this.viewRawUrl = null;
    }
    this.viewSafeUrl.set(null);
    this.viewingItem.set(null);
    this.viewModalOpen.set(false);
  }

  downloadViewing(): void {
    const item = this.viewingItem();
    if (item) this.download(item);
  }

  isImage(titre: string): boolean {
    const ext = titre.split('.').pop()?.toLowerCase() ?? '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  }

  isPreviewable(titre: string): boolean {
    const ext = titre.split('.').pop()?.toLowerCase() ?? '';
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  }

  confirmDelete(item: DocumentIdeeProjetResponseDTO): void {
    this.itemToDelete = item;
    this.confirmDialogTitle = 'Supprimer le document';
    this.confirmDialogMessage = `Etes-vous sur de vouloir supprimer le document "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.documentIdeeService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.loadDocumentsByIdee(this.selectedIdeeProjetId);
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

  getIdeeProjetNom(id: string | undefined): string {
    if (!id) return '-';
    const ideeProjet = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ideeProjet ? `${ideeProjet.code} - ${ideeProjet.titre}` : '-';
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

  private findExistingActiveDocument(typeDocument: TypeDocumentProjet): DocumentIdeeProjetResponseDTO | null {
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
