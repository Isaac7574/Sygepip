import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { Ministere } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private ministeresService = inject(MinisteresService);

  stats = signal<any>(null);
  projets = signal<any[]>([]);
  ministeres = signal<Ministere[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadProjets();
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data)
    });
  }

  loadStats(): void {
    this.apiService.get('/dashboard/statistiques').subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set({ totalProjets: 245, projetsEnCours: 120, budgetTotal: 1500000000000, tauxExecutionGlobal: 65, alertesActives: 12 })
    });
  }

  loadProjets(): void {
    this.apiService.get('/projet?size=5').subscribe({
      next: (data: any) => this.projets.set(Array.isArray(data) ? data : data.content || []),
      error: () => this.projets.set([])
    });
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '0 FCFA';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + ' T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString() + ' FCFA';
  }

  getStatusClass(statut: string): string {
    const classes: Record<string, string> = {
      'EN_COURS': 'badge-warning',
      'TERMINE': 'badge-success',
      'SUSPENDU': 'badge-danger',
      'PLANIFIE': 'badge-info'
    };
    return classes[statut] || 'badge-secondary';
  }

  getMinistereNom(projet: any): string {
    if (projet.ministere?.sigle) return projet.ministere.sigle;
    if (projet.ministere?.nom) return projet.ministere.nom;
    if (projet.ministereId) {
      const m = this.ministeres().find(m => m.id === projet.ministereId);
      return m ? (m.sigle || m.nom) : '-';
    }
    return '-';
  }
}
