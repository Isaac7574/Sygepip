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

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    return (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
  }

  logout(): void {
    this.authService.logout();
  }
}
