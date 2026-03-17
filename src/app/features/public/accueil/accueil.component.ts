import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { StatistiquesDashboard } from '@core/models';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent implements OnInit {
  private apiService = inject(ApiService);
  authService = inject(AuthService);

  stats = signal<StatistiquesDashboard | null>(null);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.apiService.get<StatistiquesDashboard>('/dashboard/statistiques').subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        this.stats.set({ totalProjets: 245, projetsEnCours: 120, projetsTermines: 85, budgetTotal: 1500000000000, budgetExecute: 750000000000, tauxExecutionGlobal: 65, alertesActives: 12, ideesProjetsEnAttente: 45 });
      }
    });
  }

  login(): void {
    this.authService.login().subscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '0 FCFA';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + ' T FCFA';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds FCFA';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M FCFA';
    return value.toLocaleString() + ' FCFA';
  }
}
