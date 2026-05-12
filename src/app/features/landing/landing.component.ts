import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatistiquesDashboard } from '@core/models';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

export interface Slide {
  tag: string;
  title: string;
  titleAccent: string;
  description: string;
  kpis: { label: string; value: string; trend: string; up: boolean; color: string }[];
  chartHeights: number[];
  chartLabels: string[];
  chartTitle: string;
  color: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  currentYear = new Date().getFullYear();
  currentSlide = signal(0);
  stats = signal<StatistiquesDashboard | null>(null);
  private timer: any;

  slides: Slide[] = [
    {
      tag: 'Plateforme nationale',
      title: 'Gérez vos Projets\nd\'Investissements',
      titleAccent: 'Publics avec SYGE-PIP.',
      description: 'Centralisez la maturation, la programmation et le suivi de tous vos projets et programmes d\'investissements publics sur une seule plateforme intégrée.',
      kpis: [
        { label: 'Total Idées', value: '48', trend: '↑ 12%', up: true, color: 'blue' },
        { label: 'Projets actifs', value: '24', trend: '↑ 8%', up: true, color: 'green' },
        { label: 'En maturation', value: '13', trend: '→ stable', up: false, color: 'amber' }
      ],
      chartHeights: [50, 75, 40, 90, 60, 85, 45, 70],
      chartLabels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
      chartTitle: 'Montant par PIP Annuel',
      color: '#00a550'
    },
    {
      tag: 'Module Maturation',
      title: 'De l\'idée au projet',
      titleAccent: 'Maîtrisez la Maturation.',
      description: 'Soumettez, analysez et validez les idées de projets à travers un workflow structuré. Scoring, note conceptuelle, fiches projets — tout est centralisé.',
      kpis: [
        { label: 'Idées soumises', value: '48', trend: '↑ 5 ce mois', up: true, color: 'blue' },
        { label: 'En instruction', value: '16', trend: '↑ 3 en cours', up: true, color: 'amber' },
        { label: 'Validées', value: '29', trend: '↑ 60% taux', up: true, color: 'green' }
      ],
      chartHeights: [30, 50, 60, 45, 80, 70, 90, 75],
      chartLabels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû'],
      chartTitle: 'Idées soumises par mois',
      color: '#2563eb'
    },
    {
      tag: 'Module PIP',
      title: 'Planifiez et programmez',
      titleAccent: 'le PIP Annuel.',
      description: 'Élaborez le Programme d\'Investissement Public, gérez les enveloppes budgétaires par secteur et ministère, et pilotez l\'arbitrage des projets.',
      kpis: [
        { label: 'Projets PIP', value: '24', trend: '↑ 4 ajoutés', up: true, color: 'green' },
        { label: 'Budget total', value: '580Mds', trend: 'FCFA alloués', up: true, color: 'blue' },
        { label: 'Secteurs', value: '11', trend: '→ couverts', up: false, color: 'amber' }
      ],
      chartHeights: [60, 80, 55, 95, 70, 85, 65, 90],
      chartLabels: ['Santé', 'Éduc.', 'Agri.', 'BTP', 'Eau', 'Éner.', 'Sécu.', 'Autre'],
      chartTitle: 'Budget par secteur',
      color: '#7c3aed'
    },
    {
      tag: 'Module Suivi-Évaluation',
      title: 'Suivez l\'exécution',
      titleAccent: 'en temps réel.',
      description: 'Mesurez l\'avancement des projets, évaluez les indicateurs de performance et recevez des alertes automatiques en cas d\'écart par rapport au plan.',
      kpis: [
        { label: 'Taux exécution', value: '73%', trend: '↑ +5% ce trim.', up: true, color: 'green' },
        { label: 'Projets en retard', value: '4', trend: '↓ amélioration', up: false, color: 'amber' },
        { label: 'Alertes actives', value: '6', trend: '→ à traiter', up: false, color: 'blue' }
      ],
      chartHeights: [85, 70, 90, 60, 75, 80, 65, 88],
      chartLabels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû'],
      chartTitle: 'Taux d\'exécution mensuel',
      color: '#d97706'
    }
  ];

  ngOnInit(): void {
    this.loadStats();
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  startAutoPlay(): void {
    this.timer = setInterval(() => {
      this.currentSlide.set((this.currentSlide() + 1) % this.slides.length);
    }, 5000);
  }

  goTo(index: number): void {
    clearInterval(this.timer);
    this.currentSlide.set(index);
    this.startAutoPlay();
  }

  prev(): void {
    this.goTo((this.currentSlide() - 1 + this.slides.length) % this.slides.length);
  }

  next(): void {
    this.goTo((this.currentSlide() + 1) % this.slides.length);
  }

  loadStats(): void {
    this.apiService.get<StatistiquesDashboard>('/dashboard/statistiques').subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        this.stats.set({
          totalProjets: 0,
          projetsEnCours: 0,
          projetsTermines: 0,
          budgetTotal: 0,
          budgetExecute: 0,
          tauxExecutionGlobal: 0,
          alertesActives: 0,
          ideesProjetsEnAttente: 0
        });
      }
    });
  }

  login(): void {
    this.authService.login().subscribe();
  }
}
