import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { Actualite } from '@core/models';

@Component({
  selector: 'app-actualites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actualites.component.html',
  styleUrl: './actualites.component.scss'
})
export class ActualitesComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  actualites = signal<Actualite[]>([]);
  filteredActualites = signal<Actualite[]>([]);
  selectedActualite = signal<Actualite | null>(null);
  relatedActualites = signal<Actualite[]>([]);
  selectedCategory = signal('');
  loading = signal(false);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadActualites();

    // Check if there's an ID in the route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadActualiteById(+params['id']);
      }
    });
  }

  loadActualites(): void {
    this.loading.set(true);
    this.apiService.get<Actualite[]>('/actualite?publie=true').subscribe({
      next: (data) => {
        this.actualites.set(data);
        this.filteredActualites.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Données de démonstration
        const demoData: Actualite[] = [
          {
            id: 1,
            titre: 'Lancement du Programme National d\'Investissement 2025',
            description: 'Le gouvernement annonce le lancement d\'un programme ambitieux pour le développement des infrastructures à travers tout le pays.',
            contenu: 'Le Ministre de l\'Économie a présidé la cérémonie officielle de lancement du Programme National d\'Investissement 2025. Ce programme comprend plusieurs axes stratégiques incluant le développement des routes, l\'électrification rurale et la construction d\'établissements scolaires et sanitaires.',
            imageUrl: '',
            categorie: 'Programme',
            datePublication: new Date('2024-01-15'),
            publie: true
          },
          {
            id: 2,
            titre: 'Inauguration de la Route Nationale N°1',
            description: 'Le tronçon réhabilité de 85 km reliant Ouagadougou à Bobo-Dioulasso a été officiellement inauguré.',
            contenu: 'Cette infrastructure moderne facilite le transport de marchandises et de personnes entre les deux principales villes du Burkina Faso. Les travaux ont duré 18 mois et ont mobilisé plus de 500 emplois locaux.',
            imageUrl: '',
            categorie: 'Infrastructure',
            datePublication: new Date('2024-01-20'),
            publie: true
          },
          {
            id: 3,
            titre: 'Signature d\'accords de financement avec les PTF',
            description: 'Le Burkina Faso signe des accords de financement de 250 milliards FCFA avec ses partenaires techniques et financiers.',
            contenu: 'Ces accords permettront de financer plusieurs projets prioritaires dans les secteurs de l\'éducation, de la santé et de l\'agriculture. Les fonds seront débloqués progressivement sur une période de 3 ans.',
            imageUrl: '',
            categorie: 'Financement',
            datePublication: new Date('2024-01-25'),
            publie: true
          },
          {
            id: 4,
            titre: 'Forum National sur l\'Investissement Public',
            description: 'Plus de 300 acteurs du développement réunis pour échanger sur les meilleures pratiques en matière de gestion des investissements publics.',
            contenu: 'Le forum de trois jours a permis de partager les expériences et d\'identifier les défis communs dans la mise en œuvre des projets d\'investissement. Des recommandations ont été formulées pour améliorer l\'efficacité des processus.',
            imageUrl: '',
            categorie: 'Événement',
            datePublication: new Date('2024-02-01'),
            publie: true
          },
          {
            id: 5,
            titre: 'Construction de 50 écoles primaires',
            description: 'Le programme de construction d\'infrastructures scolaires entre dans sa phase active avec le démarrage des travaux dans 5 régions.',
            contenu: 'Ces nouvelles écoles permettront d\'accueillir près de 15 000 élèves supplémentaires et contribueront à réduire les distances parcourues par les enfants pour accéder à l\'éducation.',
            imageUrl: '',
            categorie: 'Infrastructure',
            datePublication: new Date('2024-02-05'),
            publie: true
          },
          {
            id: 6,
            titre: 'Réforme du système de suivi des projets',
            description: 'Le ministère annonce la mise en place d\'un nouveau système digital pour le suivi en temps réel de tous les projets d\'investissement.',
            contenu: 'Cette plateforme SYGEPIP permettra une meilleure transparence et facilitera la prise de décision grâce à des tableaux de bord interactifs et des rapports automatisés.',
            imageUrl: '',
            categorie: 'Programme',
            datePublication: new Date('2024-02-10'),
            publie: true
          }
        ];
        this.actualites.set(demoData);
        this.filteredActualites.set(demoData);
        this.loading.set(false);
      }
    });
  }

  loadActualiteById(id: number): void {
    const actualite = this.actualites().find(a => a.id === id);
    if (actualite) {
      this.selectActualite(actualite);
    }
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    if (category === '') {
      this.filteredActualites.set(this.actualites());
    } else {
      this.filteredActualites.set(
        this.actualites().filter(a => a.categorie === category)
      );
    }
  }

  selectActualite(actualite: Actualite): void {
    this.selectedActualite.set(actualite);

    // Load related actualites (same category, excluding current)
    this.relatedActualites.set(
      this.actualites()
        .filter(a => a.id !== actualite.id && a.categorie === actualite.categorie)
        .slice(0, 3)
    );

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
