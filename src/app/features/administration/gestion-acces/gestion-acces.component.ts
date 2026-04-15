import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { DirectionService } from '@core/services/direction.service';
import { AbacRule, Ministere, Direction } from '@core/models';

// Interface pour les actions groupées par endpoint
interface EndpointActions {
  CREATE: ActionConfig;
  READ: ActionConfig;
  UPDATE: ActionConfig;
  DELETE: ActionConfig;
}

interface ActionConfig {
  id?: string;
  roles: string[];
  ministereIds: string[];
  directionIds: string[];
  enabled: boolean;
}

interface GroupedEndpoint {
  endpoint: string;
  actions: EndpointActions;
}

@Component({
  selector: 'app-gestion-acces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-acces.component.html',
  styleUrl: './gestion-acces.component.scss'
})
export class GestionAccesComponent implements OnInit {
  private adminService = inject(AdminService);
  private ministeresService = inject(MinisteresService);
  private directionService = inject(DirectionService);
  private readonly extraEndpoints = ['/ideeprojet/mes-idees'];

  // State
  endpoints = signal<string[]>([]);
  filteredEndpoints = signal<string[]>([]);
  abacRules = signal<AbacRule[]>([]);
  ministeres = signal<Ministere[]>([]);
  directions = signal<Direction[]>([]);
  loading = signal(false);
  modalOpen = signal(false);
  saving = signal(false);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(50);
  totalItems = signal(0);
  totalPages = signal(0);

  // Search
  searchTerm = '';

  // Modal state - endpoint groupé
  selectedEndpoint = '';
  formData: EndpointActions = this.createEmptyActions();
  perActionDirections: Record<'CREATE' | 'READ' | 'UPDATE' | 'DELETE', Direction[]> = {
    CREATE: [],
    READ: [],
    UPDATE: [],
    DELETE: []
  };

  // Available roles (static)
  availableRoles = [
    'ADMIN',
    'INSTRUCTEUR',
    'AGENT',
    'CNDP',
    'DGEP',
    'MINISTERE',
    'RESPONSABLE_PROGRAMME',
    'PORTEUR_PROJET',
    'CHEF_PROJET',
    'CONSULTANT'
  ];

  // Actions available
  actions: ('CREATE' | 'READ' | 'UPDATE' | 'DELETE')[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

  // Toast state
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadEndpoints();
    this.loadAbacRules();
    this.loadMinisteres();
    this.loadDirections();
  }

  createEmptyActions(): EndpointActions {
    return {
      CREATE: { roles: [], ministereIds: [], directionIds: [], enabled: true },
      READ: { roles: [], ministereIds: [], directionIds: [], enabled: true },
      UPDATE: { roles: [], ministereIds: [], directionIds: [], enabled: true },
      DELETE: { roles: [], ministereIds: [], directionIds: [], enabled: true }
    };
  }

  loadEndpoints(): void {
    this.loading.set(true);
    this.adminService.getAbacEndpoints(this.currentPage(), this.pageSize()).subscribe({
      next: (data) => {
        const mergedEndpoints = this.mergeExtraEndpoints(data.items);
        const total = data.total + this.countMissingExtraEndpoints(data.items);
        this.endpoints.set(mergedEndpoints);
        this.filteredEndpoints.set(mergedEndpoints);
        this.totalItems.set(total);
        this.totalPages.set(Math.ceil(total / this.pageSize()));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Erreur lors du chargement des endpoints', 'error');
      }
    });
  }

  private mergeExtraEndpoints(endpoints: string[]): string[] {
    const merged = [...endpoints];

    for (const endpoint of this.extraEndpoints) {
      if (!merged.includes(endpoint)) {
        merged.unshift(endpoint);
      }
    }

    return merged;
  }

  private countMissingExtraEndpoints(endpoints: string[]): number {
    return this.extraEndpoints.filter(endpoint => !endpoints.includes(endpoint)).length;
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.searchTerm = '';
      this.loadEndpoints();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.searchTerm = '';
      this.loadEndpoints();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.searchTerm = '';
      this.loadEndpoints();
    }
  }

  // Retourne les numéros de pages à afficher avec -1 pour les ellipses
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const pages: number[] = [0];
    if (current > 2) pages.push(-1);
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  }

  loadAbacRules(): void {
    this.adminService.getAbacRules().subscribe({
      next: (data) => this.abacRules.set(data),
      error: () => this.showToast('Erreur lors du chargement des règles', 'error')
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => this.showToast('Impossible de charger la liste des ministères', 'error')
    });
  }

  loadDirections(): void {
    this.directionService.getActifs().subscribe({
      next: (data) => {
        this.directions.set(data);
        this.syncDirectionsForAllActions();
      },
      error: () => this.showToast('Impossible de charger la liste des directions', 'error')
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredEndpoints.set(
      this.endpoints().filter(ep => ep.toLowerCase().includes(term))
    );
  }

  // Get rule status for visual indicator
  getRuleStatus(endpoint: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'): 'active' | 'inactive' | 'none' {
    const rule = this.abacRules().find(
      r => r.endpoint === endpoint && r.action === action
    );
    if (!rule) return 'none';
    return rule.enabled ? 'active' : 'inactive';
  }

  // Count configured actions for an endpoint
  getConfiguredActionsCount(endpoint: string): number {
    return this.abacRules().filter(r => r.endpoint === endpoint).length;
  }

  // Get grouped data for an endpoint
  getGroupedEndpoint(endpoint: string): GroupedEndpoint {
    const actions = this.createEmptyActions();

    for (const action of this.actions) {
      const rule = this.abacRules().find(
        r => r.endpoint === endpoint && r.action === action
      );
      if (rule) {
        actions[action] = {
          id: rule.id,
          roles: [...rule.roles],
          ministereIds: [...(rule.ministereIds || [])],
          directionIds: [...rule.directionIds],
          enabled: rule.enabled
        };
      }
    }

    return { endpoint, actions };
  }

  // Open configuration modal for entire endpoint
  openConfigModal(endpoint: string): void {
    this.selectedEndpoint = endpoint;
    const grouped = this.getGroupedEndpoint(endpoint);
    this.formData = grouped.actions;
    this.syncDirectionsForAllActions();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  private syncDirectionsForAllActions(): void {
    for (const action of this.actions) {
      this.updateDirectionsForAction(action);
    }
  }

  private updateDirectionsForAction(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'): void {
    const selected = this.formData[action].ministereIds;
    if (selected.length === 0) {
      this.perActionDirections[action] = [...this.directions()];
      return;
    }
    const filtered = this.directions().filter(d => selected.includes(d.ministereId));
    const allowed = new Set(filtered.map(d => d.id));
    this.formData[action].directionIds = this.formData[action].directionIds.filter(id => allowed.has(id));
    this.perActionDirections[action] = filtered;
  }

  // Toggle role selection for a specific action
  toggleRole(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', role: string): void {
    const index = this.formData[action].roles.indexOf(role);
    if (index === -1) {
      this.formData[action].roles.push(role);
    } else {
      this.formData[action].roles.splice(index, 1);
    }
  }

  // Check if role is selected for an action
  isRoleSelected(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', role: string): boolean {
    return this.formData[action].roles.includes(role);
  }

  toggleMinistere(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', ministereId: string): void {
    const index = this.formData[action].ministereIds.indexOf(ministereId);
    if (index === -1) {
      this.formData[action].ministereIds.push(ministereId);
    } else {
      this.formData[action].ministereIds.splice(index, 1);
    }
    this.updateDirectionsForAction(action);
  }

  isMinistereSelected(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', ministereId: string): boolean {
    return this.formData[action].ministereIds.includes(ministereId);
  }

  // Toggle direction selection for a specific action
  toggleDirection(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', directionId: string): void {
    const index = this.formData[action].directionIds.indexOf(directionId);
    if (index === -1) {
      this.formData[action].directionIds.push(directionId);
    } else {
      this.formData[action].directionIds.splice(index, 1);
    }
  }

  // Check if direction is selected for an action
  isDirectionSelected(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', directionId: string): boolean {
    return this.formData[action].directionIds.includes(directionId);
  }

  // Save all rules for the endpoint
  saveAllRules(): void {
    this.saving.set(true);

    const operations: Promise<void>[] = [];

    for (const action of this.actions) {
      const actionConfig = this.formData[action];

      if (actionConfig.roles.length === 0) {
        if (actionConfig.id) {
          const deletePromise = new Promise<void>((resolve, reject) => {
            this.adminService.deleteAbacRule(actionConfig.id!).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          });
          operations.push(deletePromise);
        }
        continue;
      }

      const data: Partial<AbacRule> = {
        endpoint: this.selectedEndpoint,
        action: action,
        roles: actionConfig.roles,
        ministereIds: actionConfig.ministereIds,
        directionIds: actionConfig.directionIds,
        enabled: actionConfig.enabled
      };

      const savePromise = new Promise<void>((resolve, reject) => {
        const obs = actionConfig.id
          ? this.adminService.updateAbacRule(actionConfig.id, data)
          : this.adminService.createAbacRule(data);

        obs.subscribe({
          next: () => resolve(),
          error: (err) => reject(err)
        });
      });

      operations.push(savePromise);
    }

    Promise.all(operations)
      .then(() => {
        this.saving.set(false);
        this.closeModal();
        this.loadAbacRules();
        this.showToast('Configuration enregistrée avec succès', 'success');
      })
      .catch(() => {
        this.saving.set(false);
        this.showToast('Erreur lors de l\'enregistrement', 'error');
      });
  }

  // Get action label in French
  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'Créer',
      'READ': 'Lire',
      'UPDATE': 'Modifier',
      'DELETE': 'Supprimer'
    };
    return labels[action] || action;
  }

  // Get action icon
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'M12 4v16m8-8H4',
      'READ': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      'UPDATE': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'DELETE': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    };
    return icons[action] || '';
  }

  // Get direction name
  getDirectionNom(id: string): string {
    const direction = this.directions().find(d => d.id === id);
    return direction ? direction.nom : id;
  }

  // Show toast notification
  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
