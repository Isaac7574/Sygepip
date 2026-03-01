import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { UtilisateursService } from '@core/services/utilisateurs.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { DirectionService } from '@core/services/direction.service';
import { User, UserRegistrationRequest, Ministere, Direction } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrl: './gestion-utilisateurs.component.scss'
})
export class GestionUtilisateursComponent implements OnInit {
  private adminService = inject(AdminService);
  private utilisateursService = inject(UtilisateursService);
  private ministeresService = inject(MinisteresService);
  private directionService = inject(DirectionService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  ministeres = signal<Ministere[]>([]);
  directions = signal<Direction[]>([]);
  searchTerm = '';
  loading = signal(false);

  // Modal
  modalOpen = signal(false);
  editingUser = signal<User | null>(null);
  saving = signal(false);
  formData: Partial<UserRegistrationRequest> = this.resetForm();

  // Confirm dialog
  confirmDialogVisible = signal(false);
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  userToDelete: User | null = null;

  // Toast
  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  roles = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'INSTRUCTEUR', label: 'Instructeur' },
    { value: 'AGENT', label: 'Agent' },
    { value: 'PORTEUR_PROJET', label: 'Porteur de projet' },
    { value: 'CHEF_PROJET', label: 'Chef de projet' },
    { value: 'CONSULTANT', label: 'Consultant' }
  ];

  typesAffiliation = [
    { value: 'ETAT', label: 'État' },
    { value: 'ONG', label: 'ONG' },
    { value: 'PTF', label: 'PTF' },
    { value: 'PRIVE', label: 'Privé' },
    { value: 'COLLECTIVITE', label: 'Collectivité' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  // KPI stats
  get activeUsersCount(): number { return this.filteredUsers().filter(u => u.actif).length; }
  get inactiveUsersCount(): number { return this.filteredUsers().filter(u => !u.actif).length; }
  get adminUsersCount(): number { return this.filteredUsers().filter(u => u.role === 'ADMIN').length; }

  // Directions filtrées selon le ministère sélectionné
  get directionsFiltered(): Direction[] {
    if (!this.formData.ministereId) return this.directions();
    return this.directions().filter(d => String(d.ministereId) === String(this.formData.ministereId));
  }

  ngOnInit(): void {
    this.load();
    this.loadMinisteres();
    this.loadDirections();
  }

  private resetForm(): Partial<UserRegistrationRequest> {
    return {
      username: '',
      email: '',
      prenom: '',
      nom: '',
      password: '',
      role: 'AGENT',
      telephone: '',
      ministereId: undefined,
      directionId: undefined,
      typeAffiliation: 'ETAT',
      organisationExterne: '',
      actif: true
    };
  }

  load(): void {
    this.loading.set(true);
    this.utilisateursService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.filteredUsers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Erreur lors du chargement des utilisateurs', 'error');
      }
    });
  }

  loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => this.showToast('Impossible de charger la liste des ministères', 'error')
    });
  }

  loadDirections(): void {
    this.directionService.getAll().subscribe({
      next: (data) => this.directions.set(data),
      error: () => {}
    });
  }

  search(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers.set(this.users().filter(u =>
      u.nom?.toLowerCase().includes(term) ||
      u.prenom?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term)
    ));
  }

  openModal(): void {
    this.formData = this.resetForm();
    this.editingUser.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  edit(user: User): void {
    this.formData = {
      username: user.username,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      password: '',
      role: user.role,
      telephone: user.telephone,
      ministereId: user.ministereId,
      directionId: user.directionId,
      typeAffiliation: user.typeAffiliation,
      organisationExterne: user.organisationExterne,
      actif: user.actif
    };
    this.editingUser.set(user);
    this.modalOpen.set(true);
  }

  onMinistereChange(): void {
    this.formData.directionId = undefined;
  }

  save(): void {
    if (!this.formData.email || !this.formData.role || !this.formData.typeAffiliation) {
      this.showToast('Veuillez remplir tous les champs obligatoires (email, rôle, type d\'affiliation)', 'error');
      return;
    }
    if (!this.editingUser() && !this.formData.password) {
      this.showToast('Le mot de passe est obligatoire pour la création', 'error');
      return;
    }

    this.saving.set(true);

    if (this.editingUser()) {
      // Mode édition : on met à jour via utilisateurs service
      const updateData: Partial<User> = {
        username: this.formData.username,
        email: this.formData.email,
        prenom: this.formData.prenom,
        nom: this.formData.nom,
        role: this.formData.role,
        telephone: this.formData.telephone,
        ministereId: this.formData.ministereId,
        directionId: this.formData.directionId,
        typeAffiliation: this.formData.typeAffiliation,
        organisationExterne: this.formData.organisationExterne || undefined,
        actif: this.formData.actif
      };
      this.utilisateursService.update(this.editingUser()!.id, updateData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.load();
          this.showToast('Utilisateur modifié avec succès', 'success');
        },
        error: () => {
          this.saving.set(false);
          this.showToast('Erreur lors de la modification', 'error');
        }
      });
    } else {
      // Mode création via admin register
      const payload: UserRegistrationRequest = {
        username: this.formData.username || undefined,
        email: this.formData.email!,
        prenom: this.formData.prenom || undefined,
        nom: this.formData.nom || undefined,
        password: this.formData.password || undefined,
        role: this.formData.role,
        telephone: this.formData.telephone || undefined,
        ministereId: this.formData.ministereId || undefined,
        directionId: this.formData.directionId || undefined,
        typeAffiliation: this.formData.typeAffiliation,
        organisationExterne: this.formData.organisationExterne || undefined,
        actif: this.formData.actif ?? true
      };
      this.adminService.registerUser(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.load();
          this.showToast('Utilisateur créé avec succès', 'success');
        },
        error: () => {
          this.saving.set(false);
          this.showToast('Erreur lors de la création de l\'utilisateur', 'error');
        }
      });
    }
  }

  toggleActif(user: User): void {
    this.utilisateursService.update(user.id, { actif: !user.actif }).subscribe({
      next: () => {
        this.load();
        this.showToast(`Utilisateur ${!user.actif ? 'activé' : 'désactivé'} avec succès`, 'success');
      },
      error: () => this.showToast('Erreur lors de la mise à jour', 'error')
    });
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.confirmDialogTitle = 'Supprimer l\'utilisateur';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.prenom} ${user.nom}" (${user.email}) ?`;
    this.confirmDialogVisible.set(true);
  }

  onConfirmDelete(): void {
    if (this.userToDelete) {
      this.utilisateursService.delete(this.userToDelete.id).subscribe({
        next: () => {
          this.load();
          this.showToast('Utilisateur supprimé avec succès', 'success');
        },
        error: () => this.showToast('Erreur lors de la suppression', 'error')
      });
    }
    this.confirmDialogVisible.set(false);
    this.userToDelete = null;
  }

  onCancelDelete(): void {
    this.confirmDialogVisible.set(false);
    this.userToDelete = null;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }

  getMinistereNom(id: string | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return '-';
    return this.roles.find(r => r.value === role)?.label || role;
  }

  getRoleBadgeClass(role: string | undefined): string {
    const classes: Record<string, string> = {
      'ADMIN': 'badge-danger',
      'INSTRUCTEUR': 'badge-info',
      'AGENT': 'badge-warning',
      'PORTEUR_PROJET': 'badge-success',
      'CHEF_PROJET': 'badge-primary',
      'CONSULTANT': 'badge-gray'
    };
    return classes[role || ''] || 'badge-gray';
  }
}
