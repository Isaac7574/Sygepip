import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Actualite, Ministre, StatistiquesDashboard } from '@core/models';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  authService = inject(AuthService);

  actualites = signal<Actualite[]>([]);
  ministre = signal<Ministre | null>(null);
  stats = signal<StatistiquesDashboard | null>(null);
  currentSlide = signal(0);
  currentYear = new Date().getFullYear();

  private slideInterval: any;

  ngOnInit(): void {
    this.loadActualites();
    this.loadMinistre();
    this.loadStats();
    this.startSlideshow();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  loadActualites(): void {
    this.apiService.get<Actualite[]>('/actualite?publie=true&size=5').subscribe({
      next: (data) => this.actualites.set(data),
      error: () => {
        this.actualites.set([
          { id: 1, titre: 'Lancement du Programme National d\'Investissement', description: 'Le gouvernement lance un ambitieux programme d\'investissement pour le d\u00e9veloppement des infrastructures.', imageUrl: '', categorie: 'Programme', datePublication: new Date(), publie: true },
          { id: 2, titre: 'Inauguration de la Route Nationale N\u00b01', description: 'Le Ministre inaugure le tron\u00e7on r\u00e9habilit\u00e9 de la route nationale reliant Ouagadougou \u00e0 Bobo-Dioulasso.', imageUrl: '', categorie: 'Infrastructure', datePublication: new Date(), publie: true },
          { id: 3, titre: 'Signature d\'accords de financement', description: 'Nouveaux accords de financement sign\u00e9s avec les partenaires techniques et financiers.', imageUrl: '', categorie: 'Financement', datePublication: new Date(), publie: true }
        ]);
      }
    });
  }

  loadMinistre(): void {
    this.apiService.get<Ministre[]>('/ministre?actif=true').subscribe({
      next: (data) => {
        if (data.length > 0) this.ministre.set(data[0]);
      },
      error: () => {
        this.ministre.set({
          id: 1, nom: 'COULIBALY', prenom: 'Aboubakar', fonction: 'Ministre de l\'\u00c9conomie, des Finances et de la Prospective',
          biographie: 'Le Ministre dirige les politiques \u00e9conomiques et financi\u00e8res du Burkina Faso...', actif: true
        });
      }
    });
  }

  loadStats(): void {
    this.apiService.get<StatistiquesDashboard>('/dashboard/statistiques').subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        this.stats.set({ totalProjets: 245, projetsEnCours: 120, projetsTermines: 85, budgetTotal: 1500000000000, budgetExecute: 750000000000, tauxExecutionGlobal: 65, alertesActives: 12, ideesProjetsEnAttente: 45 });
      }
    });
  }

  startSlideshow(): void {
    this.slideInterval = setInterval(() => this.nextSlide(), 6000);
  }

  stopSlideshow(): void {
    if (this.slideInterval) clearInterval(this.slideInterval);
  }

  nextSlide(): void {
    const total = this.actualites().length;
    if (total > 0) {
      this.currentSlide.update(v => (v + 1) % total);
    }
  }

  prevSlide(): void {
    const total = this.actualites().length;
    if (total > 0) {
      this.currentSlide.update(v => (v - 1 + total) % total);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.stopSlideshow();
    this.startSlideshow();
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
