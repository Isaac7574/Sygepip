import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface TexteReglementaire {
  id: number;
  titre: string;
  numero: string;
  type: 'Loi' | 'Décret' | 'Arrêté' | 'Circulaire' | 'Instruction';
  datePublication: Date | string;
  description: string;
  contenu?: string;
  documentUrl?: string;
  statut: 'En vigueur' | 'Abrogé' | 'Modifié';
}

@Component({
  selector: 'app-textes-reglementaires',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './textes-reglementaires.component.html',
  styleUrl: './textes-reglementaires.component.scss'
})
export class TextesReglementairesComponent implements OnInit {
  private apiService = inject(ApiService);

  textes = signal<TexteReglementaire[]>([]);
  filteredTextes = signal<TexteReglementaire[]>([]);
  selectedTexte = signal<TexteReglementaire | null>(null);
  selectedType = signal('');
  searchQuery = '';
  loading = signal(false);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadTextes();
  }

  loadTextes(): void {
    this.loading.set(true);
    this.apiService.get<TexteReglementaire[]>('/textereglementaire').subscribe({
      next: (data) => {
        this.textes.set(data);
        this.filteredTextes.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Données de démonstration
        const demoData: TexteReglementaire[] = [
          {
            id: 1,
            titre: 'Loi portant réglementation générale des investissements publics',
            numero: 'Loi N°012-2023/AN',
            type: 'Loi',
            datePublication: new Date('2023-03-15'),
            description: 'Loi établissant le cadre juridique général de la planification, de l\'exécution et du suivi des investissements publics au Burkina Faso.',
            contenu: 'Cette loi établit les principes fondamentaux régissant la gestion des investissements publics, définit les rôles et responsabilités des différents acteurs, et met en place les mécanismes de contrôle et de suivi.',
            documentUrl: 'https://example.com/loi-012-2023.pdf',
            statut: 'En vigueur'
          },
          {
            id: 2,
            titre: 'Décret portant création et organisation du SYGEPIP',
            numero: 'Décret N°2023-456/PRES/PM/MINEFID',
            type: 'Décret',
            datePublication: new Date('2023-06-20'),
            description: 'Décret créant le Système de Gestion Intégrée des Projets et Programmes d\'Investissements Publics et définissant son organisation et son fonctionnement.',
            contenu: 'Le présent décret crée le SYGEPIP comme plateforme unique de gestion des investissements publics, définit sa gouvernance, ses attributions et ses modalités de fonctionnement.',
            documentUrl: 'https://example.com/decret-456-2023.pdf',
            statut: 'En vigueur'
          },
          {
            id: 3,
            titre: 'Arrêté fixant les modalités de suivi des projets d\'investissement',
            numero: 'Arrêté N°2023-789/MINEFID/CAB',
            type: 'Arrêté',
            datePublication: new Date('2023-09-10'),
            description: 'Arrêté déterminant les procédures et outils de suivi de l\'exécution physique et financière des projets d\'investissement public.',
            contenu: 'Cet arrêté précise les indicateurs de suivi, la périodicité des rapports, les responsabilités des maîtres d\'ouvrage et les sanctions en cas de non-respect des obligations de reporting.',
            documentUrl: 'https://example.com/arrete-789-2023.pdf',
            statut: 'En vigueur'
          },
          {
            id: 4,
            titre: 'Circulaire relative à l\'élaboration des fiches de projets',
            numero: 'Circulaire N°001/MINEFID/DGEP',
            type: 'Circulaire',
            datePublication: new Date('2023-11-05'),
            description: 'Circulaire définissant le format standard et le contenu requis des fiches de projets d\'investissement public.',
            contenu: 'La présente circulaire établit le modèle unique de fiche de projet comprenant les sections obligatoires : contexte, objectifs, résultats attendus, budget prévisionnel, chronogramme et dispositif de suivi-évaluation.',
            documentUrl: 'https://example.com/circulaire-001-2023.pdf',
            statut: 'En vigueur'
          },
          {
            id: 5,
            titre: 'Loi de finances pour la gestion 2024',
            numero: 'Loi N°045-2023/AN',
            type: 'Loi',
            datePublication: new Date('2023-12-20'),
            description: 'Loi déterminant les ressources et les charges de l\'État pour l\'année budgétaire 2024, incluant les allocations pour les investissements publics.',
            contenu: 'La loi de finances 2024 prévoit une enveloppe de 850 milliards FCFA pour les investissements publics, répartis entre les différents secteurs prioritaires.',
            documentUrl: 'https://example.com/loi-finances-2024.pdf',
            statut: 'En vigueur'
          },
          {
            id: 6,
            titre: 'Décret portant procédures de passation des marchés publics',
            numero: 'Décret N°2022-321/PRES/PM',
            type: 'Décret',
            datePublication: new Date('2022-08-15'),
            description: 'Décret établissant les procédures de passation, d\'exécution et de règlement des marchés publics et des délégations de service public.',
            contenu: 'Ce décret modernise les procédures de passation des marchés publics en intégrant la dématérialisation et en renforçant les mécanismes de transparence et de contrôle.',
            documentUrl: 'https://example.com/decret-321-2022.pdf',
            statut: 'Modifié'
          },
          {
            id: 7,
            titre: 'Arrêté portant création des comités de pilotage des programmes',
            numero: 'Arrêté N°2024-012/MINEFID/CAB',
            type: 'Arrêté',
            datePublication: new Date('2024-01-08'),
            description: 'Arrêté instituant les comités de pilotage pour les programmes d\'investissement de grande envergure et définissant leur composition et leurs attributions.',
            contenu: 'Les comités de pilotage sont chargés d\'assurer la coordination stratégique, de valider les plans d\'action et de suivre la performance des programmes d\'investissement majeurs.',
            documentUrl: 'https://example.com/arrete-012-2024.pdf',
            statut: 'En vigueur'
          },
          {
            id: 8,
            titre: 'Instruction relative aux missions de contrôle des projets',
            numero: 'Instruction N°005/IGF',
            type: 'Instruction',
            datePublication: new Date('2024-01-15'),
            description: 'Instruction de l\'Inspection Générale des Finances fixant les modalités d\'exercice des missions de contrôle des projets d\'investissement.',
            contenu: 'Cette instruction précise le cadre, la méthodologie et les outils des missions de contrôle exercées sur les projets d\'investissement public.',
            documentUrl: 'https://example.com/instruction-005-igf.pdf',
            statut: 'En vigueur'
          }
        ];
        this.textes.set(demoData);
        this.filteredTextes.set(demoData);
        this.loading.set(false);
      }
    });
  }

  filterByType(type: string): void {
    this.selectedType.set(type);
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.textes();

    // Filter by type
    if (this.selectedType() !== '') {
      filtered = filtered.filter(t => t.type === this.selectedType());
    }

    // Filter by search query
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.titre.toLowerCase().includes(query) ||
        t.numero.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    this.filteredTextes.set(filtered);
  }

  countByType(type: string): number {
    return this.textes().filter(t => t.type === type).length;
  }

  selectTexte(texte: TexteReglementaire): void {
    this.selectedTexte.set(texte);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedTexte.set(null);
    document.body.style.overflow = '';
  }

  getTypeColorClass(type: string): string {
    const classes: Record<string, string> = {
      'Loi': 'w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600',
      'Décret': 'w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600',
      'Arrêté': 'w-16 h-16 bg-bf-green-100 rounded-2xl flex items-center justify-center text-bf-green-600',
      'Circulaire': 'w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600',
      'Instruction': 'w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600'
    };
    return classes[type] || 'w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600';
  }

  getTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'Loi': 'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full',
      'Décret': 'px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full',
      'Arrêté': 'px-3 py-1 bg-bf-green-100 text-bf-green-700 text-xs font-semibold rounded-full',
      'Circulaire': 'px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full',
      'Instruction': 'px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full'
    };
    return classes[type] || 'px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full';
  }

  getStatutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      'En vigueur': 'px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full',
      'Abrogé': 'px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full',
      'Modifié': 'px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full'
    };
    return classes[statut] || 'px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
