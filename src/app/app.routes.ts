import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./features/public/accueil/accueil.component').then(m => m.AccueilComponent)
  },
  {
    path: 'actualites',
    loadComponent: () => import('./features/public/actualites/actualites.component').then(m => m.ActualitesComponent)
  },
  {
    path: 'mediatheque',
    loadComponent: () => import('./features/public/mediatheque/mediatheque.component').then(m => m.MediathequeComponent)
  },
  {
    path: 'textes-reglementaires',
    loadComponent: () => import('./features/public/textes-reglementaires/textes-reglementaires.component').then(m => m.TextesReglementairesComponent)
  },
  {
    path: 'ministre',
    loadComponent: () => import('./features/public/ministre/ministre.component').then(m => m.LeMinistreComponent)
  },
  
  // Auth routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  
  // App routes (protected)
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Référentiels
      {
        path: 'referentiels',
        children: [
          {
            path: 'ministeres',
            loadComponent: () => import('./features/referentiels/ministeres/ministeres.component').then(m => m.MinisteresComponent)
          },
          {
            path: 'regions',
            loadComponent: () => import('./features/referentiels/regions/regions.component').then(m => m.RegionsComponent)
          },
          {
            path: 'secteurs',
            loadComponent: () => import('./features/referentiels/secteurs/secteurs.component').then(m => m.SecteursComponent)
          },
          {
            path: 'programmes',
            loadComponent: () => import('./features/referentiels/programmes/programmes.component').then(m => m.ProgrammesComponent)
          },
          {
            path: 'sources-financement',
            loadComponent: () => import('./features/referentiels/sources-financement/sources-financement.component').then(m => m.SourcesdeFinancementComponent)
          },
          {
            path: 'directions',
            loadComponent: () => import('./features/referentiels/directions/directions.component').then(m => m.DirectionsComponent)
          }
        ]
      },
      // Maturation
      {
        path: 'maturation',
        children: [
          {
            path: 'idees-projet',
            loadComponent: () => import('./features/maturation/idees-projet/idees-projet.component').then(m => m.IdeesdeProjetComponent)
          },
          {
            path: 'workflow',
            loadComponent: () => import('./features/maturation/workflow/workflow.component').then(m => m.WorkflowComponent)
          },
          {
            path: 'scoring',
            loadComponent: () => import('./features/maturation/scoring/scoring.component').then(m => m.ScoringComponent)
          },
          {
            path: 'documents',
            loadComponent: () => import('./features/maturation/documents/documents.component').then(m => m.DocumentsComponent)
          }
        ]
      },
      // PIP
      {
        path: 'pip',
        children: [
          {
            path: 'projets',
            loadComponent: () => import('./features/pip/projets/projets.component').then(m => m.ProjetsPIPComponent)
          },
          {
            path: 'programmation',
            loadComponent: () => import('./features/pip/programmation/programmation.component').then(m => m.ProgrammationComponent)
          },
          {
            path: 'arbitrage',
            loadComponent: () => import('./features/pip/arbitrage/arbitrage.component').then(m => m.ArbitrageComponent)
          },
          {
            path: 'enveloppes',
            loadComponent: () => import('./features/pip/enveloppes/enveloppes.component').then(m => m.EnveloppesComponent)
          }
        ]
      },
      // Suivi
      {
        path: 'suivi',
        children: [
          {
            path: 'execution',
            loadComponent: () => import('./features/suivi/execution/execution.component').then(m => m.SuiviExecutionComponent)
          },
          {
            path: 'indicateurs',
            loadComponent: () => import('./features/suivi/indicateurs/indicateurs.component').then(m => m.IndicateursComponent)
          },
          {
            path: 'evaluations',
            loadComponent: () => import('./features/suivi/evaluations/evaluations.component').then(m => m.ÉvaluationsComponent)
          },
          {
            path: 'cartographie',
            loadComponent: () => import('./features/suivi/cartographie/cartographie.component').then(m => m.CartographieComponent)
          },
          {
            path: 'alertes',
            loadComponent: () => import('./features/suivi/alertes/alertes.component').then(m => m.AlertesComponent)
          }
        ]
      },
      // Rapports
      {
        path: 'rapports',
        loadComponent: () => import('./features/rapports/rapports.component').then(m => m.RapportsComponent)
      },
      // Profil
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      // Gestion Contenu Public
      {
        path: 'gestion',
        children: [
          {
            path: 'actualites',
            loadComponent: () => import('./features/gestion/gestion-actualites/gestion-actualites.component').then(m => m.GestionActualitesComponent)
          },
          {
            path: 'medias',
            loadComponent: () => import('./features/gestion/gestion-medias/gestion-medias.component').then(m => m.GestionMediasComponent)
          },
          {
            path: 'textes',
            loadComponent: () => import('./features/gestion/gestion-textes/gestion-textes.component').then(m => m.GestionTextesComponent)
          },
          {
            path: 'ministre',
            loadComponent: () => import('./features/gestion/gestion-ministre/gestion-ministre.component').then(m => m.GestionMinistreComponent)
          }
        ]
      },
      // Administration
      {
        path: 'administration',
        children: [
          {
            path: 'gestion-acces',
            loadComponent: () => import('./features/administration/gestion-acces/gestion-acces.component').then(m => m.GestionAccesComponent)
          },
          {
            path: 'utilisateurs',
            loadComponent: () => import('./features/administration/gestion-utilisateurs/gestion-utilisateurs.component').then(m => m.GestionUtilisateursComponent)
          }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Fallback
  { path: '**', redirectTo: '' }
];
