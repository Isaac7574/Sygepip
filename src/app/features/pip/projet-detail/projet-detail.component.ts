import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjetsService } from '@core/services/projets.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import { RegionsService } from '@core/services/regions.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { Projet, Ministere, Secteur, Region, Programme, IdeeProjet } from '@core/models';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './projet-detail.component.html',
  styleUrl: './projet-detail.component.scss'
})
export class ProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projetsService = inject(ProjetsService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);
  private regionsService = inject(RegionsService);
  private programmesService = inject(ProgrammesService);
  private ideesProjetService = inject(IdeesProjetService);

  projet = signal<Projet | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);
  regions = signal<Region[]>([]);
  programmes = signal<Programme[]>([]);
  ideesProjet = signal<IdeeProjet[]>([]);

  categories = [
    { value: 'NOUVEAU', label: 'Nouveau' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EXTENSION', label: 'Extension' },
    { value: 'REHABILITATION', label: 'Réhabilitation' }
  ];

  statuts = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  ngOnInit(): void {
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
    this.regionsService.getAll().subscribe({ next: (data) => this.regions.set(data) });
    this.programmesService.getAll().subscribe({ next: (data) => this.programmes.set(data) });
    this.ideesProjetService.getAll().subscribe({ next: (data) => this.ideesProjet.set(data) });

    this.route.paramMap.subscribe(params => {
      const id = params.get('idprojet') ?? params.get('id');
      if (!id) {
        this.error.set('Identifiant du projet manquant.');
        this.loading.set(false);
        return;
      }
      this.loadProjet(id);
    });
  }

  private loadProjet(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.projetsService.getById(id).subscribe({
      next: (data) => {
        this.projet.set(this.adaptProjetDates(data));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement du projet.');
        this.loading.set(false);
      }
    });
  }

  private adaptProjetDates(projet: any): Projet {
    return {
      ...projet,
      dateDebut: projet.dateDebut ? new Date(projet.dateDebut) : undefined,
      dateFin: projet.dateFin ? new Date(projet.dateFin) : undefined,
      dateDebutPrevu: projet.dateDebutPrevu ? new Date(projet.dateDebutPrevu) : undefined,
      dateFinPrevu: projet.dateFinPrevu ? new Date(projet.dateFinPrevu) : undefined,
      createdAt: projet.createdAt ? new Date(projet.createdAt) : new Date(),
      dateCreation: projet.dateCreation ? new Date(projet.dateCreation) : new Date(),
      statut: projet.statut || 'PLANIFIE',
      categorie: projet.categorie || 'NOUVEAU'
    };
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? m.nom : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  getRegionNom(id: string | number | undefined): string {
    if (!id) return '-';
    const r = this.regions().find(r => String(r.id) === String(id));
    return r ? r.nom : '-';
  }

  getProgrammeNom(id: string | number | undefined): string {
    if (!id) return '-';
    const p = this.programmes().find(p => String(p.id) === String(id));
    return p ? (p.code + ' - ' + p.nom) : '-';
  }

  getIdeeProjetNom(id: string | number | undefined): string {
    if (!id) return '-';
    const ip = this.ideesProjet().find(ip => String(ip.id) === String(id));
    return ip ? (ip.code + ' - ' + ip.titre) : '-';
  }

  getCategorieLabel(value: string | undefined): string {
    if (!value) return '-';
    return this.categories.find(c => c.value === value)?.label || value;
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-secondary';
    const classes: Record<string, string> = {
      'PLANIFIE': 'badge-info',
      'EN_COURS': 'badge-warning',
      'SUSPENDU': 'badge-danger',
      'TERMINE': 'badge-success',
      'ANNULE': 'badge-secondary'
    };
    return classes[statut] || 'badge-secondary';
  }

  formatBudget(value: number | undefined): string {
    if (!value) return '-';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Mds';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
    return value.toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
