import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { keycloakConfig } from '../../../keycloak.config';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    try {
      const resetUrl = keycloakConfig.url + '/realms/' + keycloakConfig.realm + '/login-actions/reset-credentials?client_id=' + keycloakConfig.clientId;
      window.location.href = resetUrl;
    } catch {
      this.loading.set(false);
      this.error.set("Erreur de redirection vers le serveur d'authentification");
    }
  }

  retry(): void {
    this.loading.set(true);
    this.error.set('');
    try {
      const resetUrl = keycloakConfig.url + '/realms/' + keycloakConfig.realm + '/login-actions/reset-credentials?client_id=' + keycloakConfig.clientId;
      window.location.href = resetUrl;
    } catch {
      this.loading.set(false);
      this.error.set('Erreur de redirection');
    }
  }
}
