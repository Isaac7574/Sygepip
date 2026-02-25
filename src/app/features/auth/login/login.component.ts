import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private keycloak = inject(KeycloakService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal('');
  currentYear = new Date().getFullYear();

  async ngOnInit(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloak.isLoggedIn();

      if (isLoggedIn) {
        // Already logged in, redirect to dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
        this.router.navigateByUrl(returnUrl);
      } else {
        // Redirect to Keycloak login
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
        await this.keycloak.login({
          redirectUri: window.location.origin + returnUrl
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      this.loading.set(false);
      this.error.set('Erreur de connexion au serveur d\'authentification');
    }
  }

  async retryLogin(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.keycloak.login({
        redirectUri: window.location.origin + '/admin/dashboard'
      });
    } catch (err) {
      this.loading.set(false);
      this.error.set('Erreur de connexion');
    }
  }
}
