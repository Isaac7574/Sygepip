import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { Ministre } from '@core/models';

@Component({
  selector: 'app-le-ministre',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ministre.component.html',
  styleUrl: './ministre.component.scss'
})
export class LeMinistreComponent implements OnInit {
  private apiService = inject(ApiService);

  ministre = signal<Ministre | null>(null);
  loading = signal(false);
  currentYear = new Date().getFullYear();

  // Demo data for experiences
  experiences = signal([
    {
      poste: 'Ministre de l\'Économie, des Finances et de la Prospective',
      institution: 'Gouvernement du Burkina Faso',
      periode: '2022 - Présent',
      description: 'Direction de la politique économique et financière du pays, supervision des investissements publics et gestion du budget de l\'État.'
    },
    {
      poste: 'Directeur Général du Trésor et de la Comptabilité Publique',
      institution: 'Ministère des Finances',
      periode: '2018 - 2022',
      description: 'Gestion de la trésorerie publique, supervision des opérations comptables de l\'État et coordination avec les institutions financières internationales.'
    },
    {
      poste: 'Directeur de la Dette Publique',
      institution: 'Ministère de l\'Économie',
      periode: '2014 - 2018',
      description: 'Gestion du portefeuille de la dette publique, négociation des accords de financement et élaboration de la stratégie d\'endettement.'
    },
    {
      poste: 'Conseiller Technique',
      institution: 'Cabinet du Premier Ministre',
      periode: '2010 - 2014',
      description: 'Conseil en matière de politique économique et financière, participation à l\'élaboration des stratégies de développement.'
    }
  ]);

  educations = signal([
    {
      diplome: 'Doctorat en Sciences Économiques',
      institution: 'Université Paris-Dauphine',
      annee: '2008'
    },
    {
      diplome: 'Master en Finance Publique',
      institution: 'École Nationale d\'Administration (ENA)',
      annee: '2004'
    },
    {
      diplome: 'Diplôme d\'Études Supérieures en Économie',
      institution: 'Université de Ouagadougou',
      annee: '2001'
    },
    {
      diplome: 'Licence en Sciences Économiques',
      institution: 'Université de Ouagadougou',
      annee: '1998'
    }
  ]);

  achievements = signal([
    {
      titre: 'Réforme du système de gestion des investissements',
      description: 'Mise en place du SYGEPIP pour une gestion moderne et transparente des projets d\'investissement public.'
    },
    {
      titre: 'Mobilisation de financements',
      description: 'Obtention de plus de 500 milliards FCFA de financements auprès des partenaires techniques et financiers.'
    },
    {
      titre: 'Amélioration du climat des affaires',
      description: 'Réformes structurelles ayant permis au Burkina Faso de progresser de 15 places dans le classement Doing Business.'
    },
    {
      titre: 'Digitalisation des services',
      description: 'Lancement de plusieurs plateformes digitales pour moderniser les services financiers et améliorer la transparence.'
    }
  ]);

  ngOnInit(): void {
    this.loadMinistre();
  }

  loadMinistre(): void {
    this.loading.set(true);
    this.apiService.get<Ministre[]>('/ministre?actif=true').subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.ministre.set(data[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        // Données de démonstration
        this.ministre.set({
          id: 1,
          nom: 'NACANABO',
          prenom: 'Aboubakar',
          fonction: 'Ministre de l\'Économie, des Finances et de la Prospective',
          biographie: 'Économiste de formation avec plus de 25 ans d\'expérience dans la gestion des finances publiques et la politique économique, M. Aboubakar NACANABO a occupé plusieurs postes stratégiques au sein de l\'administration burkinabè. Diplômé de l\'Université Paris-Dauphine avec un doctorat en sciences économiques, il a contribué à l\'élaboration et à la mise en œuvre de nombreuses réformes structurelles visant à moderniser l\'économie burkinabè. Son expertise reconnue en matière de gestion macroéconomique, de mobilisation de ressources et de coordination des politiques publiques fait de lui un acteur clé du développement économique du Burkina Faso. Sous sa direction, le ministère s\'est engagé dans une dynamique de transformation digitale et de renforcement de la transparence dans la gestion des investissements publics.',
          actif: true
        });
        this.loading.set(false);
      }
    });
  }
}
