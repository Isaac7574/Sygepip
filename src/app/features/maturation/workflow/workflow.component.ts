import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowEtape } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss'
})
export class WorkflowComponent implements OnInit {
  private workflowService = inject(WorkflowService);

  items = signal<WorkflowEtape[]>([]);
  filteredItems = signal<WorkflowEtape[]>([]);
  searchTerm = '';
  modalOpen = signal(false);
  editingItem = signal<WorkflowEtape | null>(null);
  saving = signal(false);
  formData: Partial<WorkflowEtape> = { module: 'MATURATION', codeEtape: '', nomEtape: '', ordre: 1, description: '', delaiJours: undefined, roleValidateur: '', actif: true };

  modules = [
    { value: 'MATURATION', label: 'Maturation' },
    { value: 'PIP', label: 'PIP' },
    { value: 'SUIVI', label: 'Suivi' }
  ];

  // Form validation
  formErrors = signal<Record<string, string>>({});

  // Confirm dialog state
  confirmDialogVisible = signal(false);
  confirmDialogTitle = 'Confirmer la suppression';
  confirmDialogMessage = 'Êtes-vous sûr de vouloir supprimer cette étape ? Cette action est irréversible.';
  itemToDelete = signal<WorkflowEtape | null>(null);

  // Toast state
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  private toastTimer: any;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.workflowService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filteredItems.set(data); },
      error: () => { this.showToast('Erreur lors du chargement des étapes.', 'error'); }
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems.set(this.items().filter(i =>
      i.nomEtape?.toLowerCase().includes(term) || i.codeEtape?.toLowerCase().includes(term) || i.module?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = { module: 'MATURATION', codeEtape: '', nomEtape: '', ordre: 1, description: '', delaiJours: undefined, roleValidateur: '', actif: true };
    this.formErrors.set({});
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formErrors.set({});
  }

  edit(item: WorkflowEtape): void {
    this.formData = { ...item };
    this.formErrors.set({});
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!this.formData.codeEtape || !this.formData.codeEtape.trim()) {
      errors['codeEtape'] = 'Le code de l\'étape est obligatoire.';
    }

    if (!this.formData.nomEtape || !this.formData.nomEtape.trim()) {
      errors['nomEtape'] = 'Le nom de l\'étape est obligatoire.';
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving.set(true);
    const isEditing = !!this.editingItem();
    const obs = isEditing
      ? this.workflowService.update(this.editingItem()!.id, this.formData)
      : this.workflowService.create(this.formData);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.showToast(
          isEditing ? 'Étape modifiée avec succès.' : 'Étape créée avec succès.',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast(
          isEditing ? 'Erreur lors de la modification de l\'étape.' : 'Erreur lors de la création de l\'étape.',
          'error'
        );
      }
    });
  }

  confirmDelete(item: WorkflowEtape): void {
    this.itemToDelete.set(item);
    this.confirmDialogTitle = 'Confirmer la suppression';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer l'étape "${item.nomEtape}" ? Cette action est irréversible.`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    const item = this.itemToDelete();
    this.confirmDialogVisible.set(false);
    if (item) {
      this.workflowService.delete(item.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Étape supprimée avec succès.', 'success');
        },
        error: () => {
          this.showToast('Erreur lors de la suppression de l\'étape.', 'error');
        }
      });
    }
    this.itemToDelete.set(null);
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.itemToDelete.set(null);
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
  }

  hideToast(): void {
    this.toastVisible.set(false);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  getModuleBadgeClass(module: string): string {
    const classes: Record<string, string> = {
      'MATURATION': 'badge-info',
      'PIP': 'badge-warning',
      'SUIVI': 'badge-success'
    };
    return classes[module] || 'badge-secondary';
  }
}
