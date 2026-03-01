import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  // Form data
  selectedFile: File | null = null;
  selectedIdeeProjetId = '';
  selectedTypeDocument: TypeDocumentProjet | '' = '';

  // Versions history modal
  versionsModalOpen = signal(false);
  versionsItems = signal<DocumentIdeeProjetResponseDTO[]>([]);
  versionsLoading = signal(false);

  // View file modal
  viewModalOpen = signal(false);
  viewingItem = signal<DocumentIdeeProjetResponseDTO | null>(null);
  viewSafeUrl = signal<SafeResourceUrl | null>(null);
  viewRawUrl: string | null = null;
  viewLoading = signal(false);

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: DocumentIdeeProjetResponseDTO | null = null;

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  typesDocument: { value: TypeDocumentProjet; label: string }[] = [
    { value: 'NOTE_CONCEPTUELLE', label: 'Note conceptuelle' },
    { value: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité' },
    { value: 'RAPPORT_TECHNIQUE', label: 'Rapport technique' },
    { value: 'PLAN_FINANCEMENT', label: 'Plan de financement' },
    { value: 'CAHIER_CHARGES', label: 'Cahier des charges' },
    { value: 'RAPPORT_AVANCEMENT', label: 'Rapport d\'avancement' },
    { value: 'PV_RECEPTION', label: 'PV de réception' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.loadIdeesProjet();
  }

  loadIdeesProjet(): void {
    this.ideesProjetService.getAll().subscribe({
      next: (data) => this.ideesProjet.set(data),
      error: () => this.showToast('Erreur lors du chargement des idées projet', 'error')
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

    // Recherche via API
    this.documentIdeeService.recherche(this.searchTerm).subscribe({
      next: (data) => this.filteredItems.set(data),
      error: () => {
        // Fallback local search
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
      this.showToast('Veuillez sélectionner une idée projet, un type et un fichier', 'error');
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
        this.showToast('Document uploadé avec succès', 'success');
      },
      error: () => {
        this.uploading.set(false);
        this.showToast('Erreur lors de l\'upload du document', 'error');
      }
    });
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
        // Force le bon type MIME selon l'extension (le serveur peut envoyer octet-stream)
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
      'pdf':  'application/pdf',
      'png':  'image/png',
      'jpg':  'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif':  'image/gif',
      'webp': 'image/webp',
      'svg':  'image/svg+xml',
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
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer le document "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.documentIdeeService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.loadDocumentsByIdee(this.selectedIdeeProjetId);
          this.showToast('Document supprimé avec succès', 'success');
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
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? `${ip.code} - ${ip.titre}` : '-';
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
}
