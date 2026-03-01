import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  authService = inject(AuthService);

  sidebarOpen = signal(true);
  userMenuOpen = signal(false);

  // Collapsible sections — fermés par défaut
  referentielsOpen = signal(false);
  maturationOpen = signal(false);
  pipOpen = signal(false);
  suiviOpen = signal(false);
  rapportsOpen = signal(false);
  gestionOpen = signal(false);
  adminOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  toggleReferentiels(): void { this.referentielsOpen.update(v => !v); }
  toggleMaturation(): void { this.maturationOpen.update(v => !v); }
  togglePip(): void { this.pipOpen.update(v => !v); }
  toggleSuivi(): void { this.suiviOpen.update(v => !v); }
  toggleRapports(): void { this.rapportsOpen.update(v => !v); }
  toggleGestion(): void { this.gestionOpen.update(v => !v); }
  toggleAdmin(): void { this.adminOpen.update(v => !v); }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    return (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
  }

  logout(): void {
    this.authService.logout();
  }
}
