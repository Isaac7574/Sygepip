import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { User, Ministere } from '@core/models';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private ministeresService = inject(MinisteresService);

  ministeres = signal<Ministere[]>([]);
  saving = signal(false);
  changingPassword = signal(false);
  editMode = signal(false);

  profileData: Partial<User> = {};

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  toastVisible = signal(false);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadProfile();
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data)
    });
  }

  private loadProfile(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileData = { ...user };
    }
  }

  toggleEditMode(): void {
    if (this.editMode()) {
      this.loadProfile();
    }
    this.editMode.update(v => !v);
  }

  saveProfile(): void {
    if (!this.profileData.nom || !this.profileData.prenom) {
      this.showToast('Le nom et le prénom sont obligatoires', 'error');
      return;
    }
    if (!this.profileData.email) {
      this.showToast('L\'email est obligatoire', 'error');
      return;
    }
    this.saving.set(true);
    this.authService.updateProfile(this.profileData).subscribe({
      next: () => {
        this.saving.set(false);
        this.editMode.set(false);
        this.showToast('Profil mis à jour avec succès', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Erreur lors de la mise à jour du profil', 'error');
      }
    });
  }

  changePassword(): void {
    if (!this.passwordData.currentPassword) {
      this.showToast('Veuillez saisir votre mot de passe actuel', 'error');
      return;
    }
    if (!this.passwordData.newPassword || this.passwordData.newPassword.length < 6) {
      this.showToast('Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    this.changingPassword.set(true);
    this.authService.changePassword(this.passwordData.currentPassword, this.passwordData.newPassword).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.showToast('Mot de passe modifié avec succès', 'success');
      },
      error: () => {
        this.changingPassword.set(false);
        this.showToast('Erreur lors du changement de mot de passe', 'error');
      }
    });
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? m.nom : '-';
  }

  getRoleLabel(role: string | undefined): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrateur',
      'MANAGER': 'Manager',
      'USER': 'Utilisateur',
      'VIEWER': 'Lecteur'
    };
    return role ? (labels[role] || role) : '-';
  }

  getRoleBadgeClass(role: string | undefined): string {
    const classes: Record<string, string> = {
      'ADMIN': 'bg-bf-red-100 text-bf-red-700',
      'MANAGER': 'bg-bf-yellow-100 text-bf-yellow-700',
      'USER': 'bg-bf-green-100 text-bf-green-700',
      'VIEWER': 'bg-blue-100 text-blue-700'
    };
    return role ? (classes[role] || 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible.set(true);
  }
}
