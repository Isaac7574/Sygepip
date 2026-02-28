import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  // Form data
  selectedFile: File | null = null;
  selectedProjetId = '';
  selectedTypeDocument: TypeDocumentProjet | '' = '';

  // Versions history modal
  versionsModalOpen = signal(false);
  versionsItems = signal<DocumentProjetResponseDTO[]>([]);
  versionsLoading = signal(false);

  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  itemToDelete: DocumentProjetResponseDTO | null = null;

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

    // Recherche via API
    this.documentProjetService.recherche(this.searchTerm).subscribe({
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
      this.showToast('Veuillez sélectionner un projet, un type et un fichier', 'error');
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
        this.showToast('Document uploadé avec succès', 'success');
      },
      error: () => {
        this.uploading.set(false);
        this.showToast('Erreur lors de l\'upload du document', 'error');
      }
    });
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
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer le document "${item.titre}" ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.itemToDelete) {
      this.documentProjetService.delete(this.itemToDelete.id).subscribe({
        next: () => {
          this.loadDocumentsByProjet(this.selectedProjetId);
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

  getProjetNom(id: string | undefined): string {
    if (!id) return '-';
    const p = this.projets().find(p => String(p.id) === String(id));
    return p ? `${p.code} - ${p.titre}` : '-';
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
