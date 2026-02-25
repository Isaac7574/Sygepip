import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '@core/services/api.service';

interface Media {
  id: number;
  titre: string;
  description?: string;
  type: 'video' | 'image' | 'document';
  url: string;
  thumbnailUrl?: string;
  dateAjout: Date | string;
  categorie?: string;
}

@Component({
  selector: 'app-mediatheque',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mediatheque.component.html',
  styleUrl: './mediatheque.component.scss'
})
export class MediathequeComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  medias = signal<Media[]>([]);
  filteredMedias = signal<Media[]>([]);
  selectedMedia = signal<Media | null>(null);
  selectedType = signal<'all' | 'video' | 'image' | 'document'>('all');
  loading = signal(false);
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadMedias();

    // Check for type filter in query params
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.filterByType(params['type']);
      }
    });
  }

  loadMedias(): void {
    this.loading.set(true);
    this.apiService.get<Media[]>('/media').subscribe({
      next: (data) => {
        this.medias.set(data);
        this.filteredMedias.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Données de démonstration
        const demoData: Media[] = [
          // Videos
          {
            id: 1,
            titre: 'Inauguration du Programme National d\'Investissement',
            description: 'Cérémonie officielle de lancement du PNI 2025 en présence du Ministre',
            type: 'video',
            url: 'https://example.com/video1.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800',
            dateAjout: new Date('2024-01-15'),
            categorie: 'Événement'
          },
          {
            id: 2,
            titre: 'Visite du chantier de la Route Nationale N°1',
            description: 'Inspection des travaux de réhabilitation par les autorités',
            type: 'video',
            url: 'https://example.com/video2.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
            dateAjout: new Date('2024-01-20'),
            categorie: 'Infrastructure'
          },
          // Images
          {
            id: 3,
            titre: 'Construction du complexe scolaire de Bobo-Dioulasso',
            description: 'Vue aérienne du nouveau complexe scolaire en construction',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200',
            dateAjout: new Date('2024-02-01'),
            categorie: 'Infrastructure'
          },
          {
            id: 4,
            titre: 'Signature des accords de financement',
            description: 'Cérémonie de signature avec les partenaires techniques et financiers',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',
            dateAjout: new Date('2024-02-05'),
            categorie: 'Financement'
          },
          {
            id: 5,
            titre: 'Forum National sur l\'Investissement Public',
            description: 'Photo de groupe des participants au forum',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
            dateAjout: new Date('2024-02-10'),
            categorie: 'Événement'
          },
          {
            id: 6,
            titre: 'Inauguration de l\'hôpital régional',
            description: 'Le Ministre inaugurant le nouvel hôpital régional',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200',
            dateAjout: new Date('2024-02-12'),
            categorie: 'Infrastructure'
          },
          // Documents
          {
            id: 7,
            titre: 'Rapport Annuel SYGEPIP 2023',
            description: 'Rapport complet sur les activités et réalisations de l\'année 2023',
            type: 'document',
            url: 'https://example.com/rapport-2023.pdf',
            dateAjout: new Date('2024-01-10'),
            categorie: 'Rapport'
          },
          {
            id: 8,
            titre: 'Guide de Gestion des Projets d\'Investissement',
            description: 'Manuel pratique pour la gestion des projets PIP',
            type: 'document',
            url: 'https://example.com/guide.pdf',
            dateAjout: new Date('2024-01-25'),
            categorie: 'Guide'
          },
          {
            id: 9,
            titre: 'Stratégie Nationale de Développement 2025-2030',
            description: 'Document stratégique pour le développement du Burkina Faso',
            type: 'document',
            url: 'https://example.com/strategie.pdf',
            dateAjout: new Date('2024-02-01'),
            categorie: 'Stratégie'
          },
          {
            id: 10,
            titre: 'Présentation du Programme d\'Électrification Rurale',
            description: 'Slides de présentation du programme PER',
            type: 'document',
            url: 'https://example.com/presentation.pdf',
            dateAjout: new Date('2024-02-08'),
            categorie: 'Présentation'
          }
        ];
        this.medias.set(demoData);
        this.filteredMedias.set(demoData);
        this.loading.set(false);
      }
    });
  }

  filterByType(type: string): void {
    this.selectedType.set(type as any);
    if (type === 'all') {
      this.filteredMedias.set(this.medias());
    } else {
      this.filteredMedias.set(
        this.medias().filter(m => m.type === type)
      );
    }
  }

  countByType(type: 'video' | 'image' | 'document'): number {
    return this.medias().filter(m => m.type === type).length;
  }

  selectMedia(media: Media): void {
    this.selectedMedia.set(media);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedMedia.set(null);
    // Restore body scroll
    document.body.style.overflow = '';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'video': 'Vidéo',
      'image': 'Photo',
      'document': 'Document'
    };
    return labels[type] || type;
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
