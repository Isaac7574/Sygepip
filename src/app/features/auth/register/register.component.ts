import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private keycloak = inject(KeycloakService);
  private router = inject(Router);

  loading = signal(true);
  error = signal('');
  currentYear = new Date().getFullYear();

  async ngOnInit(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloak.isLoggedIn();
      if (isLoggedIn) {
        this.router.navigate(['/app/dashboard']);
        return;
      }
      await this.keycloak.register({
        redirectUri: window.location.origin + '/app/dashboard'
      });
    } catch {
      this.loading.set(false);
      this.error.set('Erreur de connexion au serveur d\'authentification');
    }
  }

  async retry(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.keycloak.register({
        redirectUri: window.location.origin + '/app/dashboard'
      });
    } catch {
      this.loading.set(false);
      this.error.set('Erreur de connexion');
    }
  }
}
