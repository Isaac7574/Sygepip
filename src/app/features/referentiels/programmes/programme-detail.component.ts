import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Ministere, Programme, Secteur } from '@core/models';
import { MinisteresService } from '@core/services/ministeres.service';
import { ProgrammesService } from '@core/services/programmes.service';
import { SecteursService } from '@core/services/secteurs.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-programme-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './programme-detail.component.html',
  styleUrl: './programme-detail.component.scss'
})
export class ProgrammeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private programmesService = inject(ProgrammesService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);

  loading = signal(true);
  errorMessage = signal('');
  programme = signal<Programme | null>(null);
  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('Programme budgetaire introuvable.');
      return;
    }

    forkJoin({
      programme: this.programmesService.getById(id),
      ministeres: this.ministeresService.getAll(),
      secteurs: this.secteursService.getAll()
    }).subscribe({
      next: ({ programme, ministeres, secteurs }) => {
        this.programme.set(programme);
        this.ministeres.set(ministeres);
        this.secteurs.set(secteurs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Impossible de charger le programme budgetaire.');
      }
    });
  }

  getMinistereNom(id: string | undefined): string {
    if (!id) return '-';
    const ministere = this.ministeres().find(item => String(item.id) === String(id));
    return ministere ? (ministere.sigle || ministere.nom) : '-';
  }

  getSecteurNom(id: string | undefined): string {
    if (!id) return '-';
    const secteur = this.secteurs().find(item => String(item.id) === String(id));
    return secteur ? secteur.nom : '-';
  }

  getNiveauPrioriteLabel(value: Programme['niveauPriorite']): string {
    switch (value) {
      case 'PHARE':
        return 'Phare';
      case 'STRUCTURANT':
        return 'Structurant';
      case 'PRIORITAIRE':
        return 'Prioritaire';
      case 'NORMAL':
        return 'Normal';
      case 'DIFFERE':
        return 'Differe';
      default:
        return '-';
    }
  }
}
