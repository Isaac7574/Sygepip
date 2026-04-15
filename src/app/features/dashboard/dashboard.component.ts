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
  private readonly exportHeaderColor = '059669';
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ministeresService = inject(MinisteresService);

  stats = signal<DashboardStats>(this.emptyStats());
  projets = signal<any[]>([]);
  ministeres = signal<Ministere[]>([]);
  loadingStats = signal(false);
  exporting = signal(false);

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

  canExportStats(): boolean {
    return this.authService.hasRole('ADMIN');
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

  formatCurrencyForExport(value: number | undefined): string {
    const amount = Math.round(value ?? 0);
    const formatted = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FCFA`;
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

  async exportStatsToExcel(): Promise<void> {
    if (!this.canExportStats()) return;

    this.exporting.set(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      const workbook = utils.book_new();

      const summaryHeaders = ['Indicateur', 'Valeur'];
      const summaryRows = this.buildSummaryRows();
      const summarySheet = utils.aoa_to_sheet([
        summaryHeaders,
        ...summaryRows.map(row => summaryHeaders.map(header => row[header] ?? ''))
      ]);
      this.applyHeaderStyle(utils, summarySheet, summaryHeaders);
      summarySheet['!cols'] = [{ wch: 34 }, { wch: 22 }];
      utils.book_append_sheet(workbook, summarySheet, 'Synthese');

      this.appendArraySheet(workbook, utils, 'Projets par PIP', ['Année', 'Nombre de projets'],
        this.stats().projetsParPipAnnuel.map(item => ({
          'Année': item.annee,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Montant par PIP', ['Année', 'Montant total'],
        this.stats().montantParPipAnnuel.map(item => ({
          'Année': item.annee,
          'Montant total': this.formatCurrencyForExport(item.montantTotal)
        }))
      );

      this.appendArraySheet(workbook, utils, 'Type projet', ['Type', 'Nombre de projets'],
        this.stats().repartitionTypeProjetPip.map(item => ({
          Type: item.typeProjetPip,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Projets secteur', ['Secteur', 'Nombre de projets'],
        this.stats().projetsParSecteur.map(item => ({
          Secteur: item.secteurNom,
          'Nombre de projets': item.nombreProjets
        }))
      );

      this.appendArraySheet(workbook, utils, 'Montant secteur', ['Secteur', 'Montant total'],
        this.stats().montantParSecteur.map(item => ({
          Secteur: item.secteurNom,
          'Montant total': this.formatCurrencyForExport(item.montantTotal)
        }))
      );

      this.appendArraySheet(workbook, utils, 'Idées cible', ['Cible', 'Nombre'],
        this.stats().ideesParCible.map(item => ({
          Cible: item.cibleLibelle,
          Nombre: item.nombre
        }))
      );

      this.appendArraySheet(workbook, utils, 'Projets cible', ['Cible', 'Nombre'],
        this.stats().projetsParCible.map(item => ({
          Cible: item.cibleLibelle,
          Nombre: item.nombre
        }))
      );

      writeFile(workbook, this.buildExportFileName('xlsx'), { cellStyles: true });
    } finally {
      this.exporting.set(false);
    }
  }

  async exportStatsToPdf(): Promise<void> {
    if (!this.canExportStats()) return;

    this.exporting.set(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const now = new Date();
      const marginLeft = 14;
      let currentY = 15;

      doc.setFontSize(14);
      doc.text('Statistiques du tableau de bord', marginLeft, currentY);
      currentY += 6;
      doc.setFontSize(9);
      doc.text(`Export du ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}`, marginLeft, currentY);

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Indicateur', 'Valeur']],
        body: this.buildSummaryRows().map(row => [row['Indicateur'], String(row['Valeur'])]),
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      const addSection = (
        title: string,
        head: string[],
        body: Array<Array<string | number>>,
        columnStyles?: Record<number, { cellWidth?: number }>
      ) => {
        const finalY = (doc as any).lastAutoTable?.finalY ?? currentY + 20;
        const nextY = finalY + 8;
        doc.setFontSize(11);
        doc.text(title, marginLeft, nextY);
        autoTable(doc, {
          startY: nextY + 2,
          head: [head],
          body,
          headStyles: { fillColor: [5, 150, 105] },
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          columnStyles
        });
      };

      addSection('Projets par PIP annuel', ['Année', 'Nombre de projets'],
        this.stats().projetsParPipAnnuel.map(item => [item.annee, item.nombreProjets]));
      addSection('Montant par PIP annuel', ['Année', 'Montant total'],
        this.stats().montantParPipAnnuel.map(item => [item.annee, this.formatCurrencyForExport(item.montantTotal)]),
        { 0: { cellWidth: 40 }, 1: { cellWidth: 70 } });
      addSection('Répartition par type de projet', ['Type', 'Nombre de projets'],
        this.stats().repartitionTypeProjetPip.map(item => [item.typeProjetPip, item.nombreProjets]));
      addSection('Projets par secteur', ['Secteur', 'Nombre de projets'],
        this.stats().projetsParSecteur.map(item => [item.secteurNom, item.nombreProjets]));
      addSection('Montant par secteur', ['Secteur', 'Montant total'],
        this.stats().montantParSecteur.map(item => [item.secteurNom, this.formatCurrencyForExport(item.montantTotal)]),
        { 0: { cellWidth: 90 }, 1: { cellWidth: 70 } });
      addSection('Idées par cible', ['Cible', 'Nombre'],
        this.stats().ideesParCible.map(item => [item.cibleLibelle, item.nombre]));
      addSection('Projets par cible', ['Cible', 'Nombre'],
        this.stats().projetsParCible.map(item => [item.cibleLibelle, item.nombre]));

      doc.save(this.buildExportFileName('pdf'));
    } finally {
      this.exporting.set(false);
    }
  }

  private buildSummaryRows(): Array<Record<string, string | number>> {
    return [
      { Indicateur: 'Total idées', Valeur: this.stats().totalIdees },
      { Indicateur: 'Total projets', Valeur: this.stats().totalProjets },
      { Indicateur: 'Projets actifs', Valeur: this.stats().totalProjetsActifs },
      { Indicateur: 'Idées en maturation', Valeur: this.stats().ideesEnMaturation },
      { Indicateur: 'Projets en planification', Valeur: this.stats().projetsEnPlanification },
      { Indicateur: 'Projets en exécution', Valeur: this.stats().projetsEnExecution },
      { Indicateur: 'Taux de transformation', Valeur: this.formatPercent(this.stats().tauxTransformationIdeesEnProjets) },
      { Indicateur: 'Taux de rejet', Valeur: this.formatPercent(this.stats().tauxRejetIdees) }
    ];
  }

  private appendArraySheet(
    workbook: any,
    utils: any,
    sheetName: string,
    headers: string[],
    rows: Array<Record<string, string | number>>
  ): void {
    const sheet = utils.aoa_to_sheet([
      headers,
      ...rows.map(row => headers.map(header => row[header] ?? ''))
    ]);
    this.applyHeaderStyle(utils, sheet, headers);
    sheet['!cols'] = headers.map(() => ({ wch: 24 }));
    utils.book_append_sheet(workbook, sheet, sheetName);
  }

  private applyHeaderStyle(utils: any, sheet: any, headers: string[]): void {
    headers.forEach((_, index) => {
      const cellRef = utils.encode_cell({ r: 0, c: index });
      const cell = sheet[cellRef];
      if (!cell) return;

      cell.s = {
        fill: {
          fgColor: { rgb: this.exportHeaderColor }
        },
        font: {
          bold: true,
          color: { rgb: 'FFFFFF' }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };
    });
  }

  private buildExportFileName(extension: 'xlsx' | 'pdf'): string {
    const date = new Date().toISOString().slice(0, 10);
    return `dashboard-statistiques-${date}.${extension}`;
  }
}
