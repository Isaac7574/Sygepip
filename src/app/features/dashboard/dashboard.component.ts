import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { DashboardStats, Ministere } from '@core/models';
import { environment } from '@env/environment';

type ChartItem = {
  label: string;
  value: number;
  formattedValue: string;
  percent: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ministeresService = inject(MinisteresService);

  stats = signal<DashboardStats>(this.emptyStats());
  projets = signal<any[]>([]);
  ministeres = signal<Ministere[]>([]);
  loadingStats = signal(false);

  projetsParPipChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParPipAnnuel.map(item => ({
        label: String(item.annee),
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  montantParPipChart = computed(() =>
    this.toChartItems(
      this.stats().montantParPipAnnuel.map(item => ({
        label: String(item.annee),
        value: item.montantTotal,
        formattedValue: this.formatCurrency(item.montantTotal)
      }))
    )
  );

  typeProjetChart = computed(() =>
    this.toChartItems(
      this.stats().repartitionTypeProjetPip.map(item => ({
        label: item.typeProjetPip,
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  projetsParSecteurChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParSecteur.map(item => ({
        label: item.secteurNom,
        value: item.nombreProjets,
        formattedValue: item.nombreProjets.toLocaleString('fr-FR')
      }))
    )
  );

  montantParSecteurChart = computed(() =>
    this.toChartItems(
      this.stats().montantParSecteur.map(item => ({
        label: item.secteurNom,
        value: item.montantTotal,
        formattedValue: this.formatCurrency(item.montantTotal)
      }))
    )
  );

  ideesParCibleChart = computed(() =>
    this.toChartItems(
      this.stats().ideesParCible.map(item => ({
        label: item.cibleLibelle,
        value: item.nombre,
        formattedValue: item.nombre.toLocaleString('fr-FR')
      }))
    )
  );

  projetsParCibleChart = computed(() =>
    this.toChartItems(
      this.stats().projetsParCible.map(item => ({
        label: item.cibleLibelle,
        value: item.nombre,
        formattedValue: item.nombre.toLocaleString('fr-FR')
      }))
    )
  );

  ngOnInit(): void {
    this.loadStats();
    this.loadProjets();
    this.ministeresService.getAll().subscribe({
      next: (data) => this.ministeres.set(data)
    });
  }

  loadStats(): void {
    this.loadingStats.set(true);
    this.authService.getTokenAsync().subscribe({
      next: (token) => {
        const headers = token
          ? new HttpHeaders({
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            })
          : undefined;

        this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/statistiques`, { headers }).subscribe({
          next: (data) => {
            this.stats.set(this.withDefaults(data));
            this.loadingStats.set(false);
          },
          error: () => {
            this.stats.set(this.emptyStats());
            this.loadingStats.set(false);
          }
        });
      },
      error: () => {
        this.stats.set(this.emptyStats());
        this.loadingStats.set(false);
      }
    });
  }

  loadProjets(): void {
    this.apiService.get('/projet?size=5').subscribe({
      next: (data: any) => this.projets.set(Array.isArray(data) ? data : data.content || []),
      error: () => this.projets.set([])
    });
  }

  private emptyStats(): DashboardStats {
    return {
      totalIdees: 0,
      totalProjets: 0,
      totalProjetsActifs: 0,
      ideesEnMaturation: 0,
      projetsEnPlanification: 0,
      projetsEnExecution: 0,
      tauxTransformationIdeesEnProjets: 0,
      tauxRejetIdees: 0,
      projetsParPipAnnuel: [],
      montantParPipAnnuel: [],
      repartitionTypeProjetPip: [],
      projetsParSecteur: [],
      montantParSecteur: [],
      ideesParCible: [],
      projetsParCible: []
    };
  }

  private withDefaults(stats: Partial<DashboardStats> | null | undefined): DashboardStats {
    return {
      ...this.emptyStats(),
      ...stats,
      projetsParPipAnnuel: stats?.projetsParPipAnnuel ?? [],
      montantParPipAnnuel: stats?.montantParPipAnnuel ?? [],
      repartitionTypeProjetPip: stats?.repartitionTypeProjetPip ?? [],
      projetsParSecteur: stats?.projetsParSecteur ?? [],
      montantParSecteur: stats?.montantParSecteur ?? [],
      ideesParCible: stats?.ideesParCible ?? [],
      projetsParCible: stats?.projetsParCible ?? []
    };
  }

  private toChartItems(items: Array<{ label: string; value: number; formattedValue: string }>): ChartItem[] {
    const max = Math.max(...items.map(item => item.value), 0);
    return items.map(item => ({
      ...item,
      percent: max > 0 ? (item.value / max) * 100 : 0
    }));
  }

  formatCompactNumber(value: number | undefined): string {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  formatCurrency(value: number | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '0 FCFA';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + ' T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  formatPercent(value: number | undefined): string {
    return `${(value ?? 0).toFixed(2)}%`;
  }

  getStatusClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_COURS: 'badge-warning',
      TERMINE: 'badge-success',
      SUSPENDU: 'badge-danger',
      PLANIFIE: 'badge-info',
      EN_EXECUTION: 'badge-warning',
      PIP_FINANCIER_CREE: 'badge-info'
    };
    return classes[statut] || 'badge-secondary';
  }

  getMinistereNom(projet: any): string {
    if (projet.ministere?.sigle) return projet.ministere.sigle;
    if (projet.ministere?.nom) return projet.ministere.nom;
    if (projet.ministereId) {
      const ministere = this.ministeres().find(item => item.id === projet.ministereId);
      return ministere ? (ministere.sigle || ministere.nom) : '-';
    }
    return '-';
  }

  getProjetTitre(projet: any): string {
    return projet.titre || projet.intitule || '-';
  }

  getProgression(projet: any): number {
    return projet.tauxExecution || 0;
  }
}
