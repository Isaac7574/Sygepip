import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IdeesProjetService } from '@core/services/idees-projet.service';
import { DocumentIdeeService } from '@core/services/document-idee.service';
import { MinisteresService } from '@core/services/ministeres.service';
import { SecteursService } from '@core/services/secteurs.service';
import {
  IdeeProjet,
  IdeeProjetNoteConceptuelle,
  Ministere,
  Secteur,
  DocumentIdeeProjetResponseDTO,
  TypeDocumentProjet
} from '@core/models';

@Component({
  selector: 'app-idee-projet-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './idee-projet-detail.component.html',
  styleUrl: './idee-projet-detail.component.scss'
})
export class IdeeProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ideesService = inject(IdeesProjetService);
  private documentIdeeService = inject(DocumentIdeeService);
  private ministeresService = inject(MinisteresService);
  private secteursService = inject(SecteursService);

  idee = signal<IdeeProjet | null>(null);
  note = signal<Partial<IdeeProjetNoteConceptuelle>>({});
  loading = signal(true);
  loadingNote = signal(false);
  error = signal<string | null>(null);
  documents = signal<DocumentIdeeProjetResponseDTO[]>([]);
  loadingDocuments = signal(false);
  documentsError = signal<string | null>(null);

  ministeres = signal<Ministere[]>([]);
  secteurs = signal<Secteur[]>([]);

  portees = [
    { value: 'NATIONALE', label: 'Nationale' },
    { value: 'REGIONALE', label: 'Régionale' },
    { value: 'PROVINCIALE', label: 'Provinciale' },
    { value: 'COMMUNALE', label: 'Communale' },
    { value: 'LOCALE', label: 'Locale' }
  ];

  statuts = [
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'SOUMIS', label: 'Soumis' },
    { value: 'EN_EVALUATION', label: 'En évaluation' },
    { value: 'VALIDE', label: 'Validé' },
    { value: 'REJETE', label: 'Rejeté' }
  ];

  typesDocument: { value: TypeDocumentProjet; label: string }[] = [
    { value: 'NOTE_CONCEPTUELLE', label: 'Note conceptuelle' },
    { value: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité' },
    { value: 'RAPPORT_TECHNIQUE', label: 'Rapport technique' },
    { value: 'PLAN_FINANCEMENT', label: 'Plan de financement' },
    { value: 'CAHIER_CHARGES', label: 'Cahier des charges' },
    { value: 'RAPPORT_AVANCEMENT', label: 'Rapport d\'avancement' },
    { value: 'PV_RECEPTION', label: 'PV de réception' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  ngOnInit(): void {
    this.loadMinisteres();
    this.loadSecteurs();

    this.route.paramMap.subscribe(params => {
      const id = params.get('ididee') ?? params.get('id');
      if (!id) {
        this.error.set('Identifiant de l’idée de projet manquant.');
        this.loading.set(false);
        return;
      }
      this.loadIdee(id);
    });
  }

  private loadIdee(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ideesService.getById(id).subscribe({
      next: (data) => {
        this.idee.set(data);
        this.loading.set(false);
        this.loadNoteConceptuelle(data.id);
        this.loadDocuments(data.id);
      },
      error: () => {
        this.error.set('Erreur lors du chargement de l’idée de projet.');
        this.loading.set(false);
      }
    });
  }

  private loadNoteConceptuelle(id: string | number): void {
    this.loadingNote.set(true);
    this.note.set({});
    this.ideesService.getNoteConceptuelle(id).subscribe({
      next: (note) => {
        this.note.set(note);
        this.loadingNote.set(false);
      },
      error: () => {
        this.loadingNote.set(false);
      }
    });
  }

  private loadDocuments(id: string | number): void {
    this.loadingDocuments.set(true);
    this.documentsError.set(null);
    this.documentIdeeService.getByIdeeProjet(String(id)).subscribe({
      next: (data) => {
        this.documents.set(data);
        this.loadingDocuments.set(false);
      },
      error: () => {
        this.documentsError.set('Erreur lors du chargement des documents.');
        this.loadingDocuments.set(false);
      }
    });
  }

  private loadMinisteres(): void {
    this.ministeresService.getAll().subscribe({ next: (data) => this.ministeres.set(data) });
  }

  private loadSecteurs(): void {
    this.secteursService.getAll().subscribe({ next: (data) => this.secteurs.set(data) });
  }

  getMinistereNom(id: string | number | undefined): string {
    if (!id) return '-';
    const m = this.ministeres().find(m => String(m.id) === String(id));
    return m ? (m.sigle || m.nom) : '-';
  }

  getSecteurNom(id: string | number | undefined): string {
    if (!id) return '-';
    const s = this.secteurs().find(s => String(s.id) === String(id));
    return s ? s.nom : '-';
  }

  getPorteeLabel(value: string | undefined): string {
    if (!value) return '-';
    return this.portees.find(p => p.value === value)?.label || value;
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return '-';
    return this.statuts.find(s => s.value === statut)?.label || statut;
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge-gray';
    const classes: Record<string, string> = {
      'BROUILLON': 'badge-gray',
      'SOUMIS': 'badge-info',
      'EN_EVALUATION': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return classes[statut] || 'badge-gray';
  }

  getNoteField(key: string): string | undefined {
    return (this.note() as Record<string, string | undefined>)[key];
  }

  getTypeDocumentLabel(type: TypeDocumentProjet): string {
    const found = this.typesDocument.find(t => t.value === type);
    return found ? found.label : type;
  }

  getDocumentStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getDecisionBadgeClass(decision: string): string {
    switch (decision) {
      case 'ACCEPTE': return 'badge-success';
      case 'REFUSE': return 'badge-danger';
      case 'EN_ATTENTE': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  downloadDocument(item: DocumentIdeeProjetResponseDTO): void {
    this.documentIdeeService.downloadAndSave(item.id, item.titre);
  }
}
