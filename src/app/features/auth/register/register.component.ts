import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { Ministere } from '@core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  registerForm: FormGroup;
  loading = signal(false);
  error = signal('');
  success = signal(false);
  showPassword = signal(false);
  ministeres = signal<Ministere[]>([]);
  currentYear = new Date().getFullYear();
  
  constructor() {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      ministereId: [''],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }
  
  ngOnInit(): void {
    this.loadMinisteres();
  }
  
  loadMinisteres(): void {
    this.apiService.get<Ministere[]>('/ministere').subscribe({
      next: (data) => this.ministeres.set(data),
      error: () => console.error('Erreur chargement ministères')
    });
  }
  
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
  
  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
  
  passwordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    
    if (hasUpperCase && hasLowerCase && hasNumeric) {
      return null;
    }
    return { passwordStrength: true };
  }
  
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }
  
  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4);
  }
  
  getPasswordStrengthClass(index: number): string {
    const strength = this.getPasswordStrength();
    if (index > strength) return 'bg-gray-200';
    
    if (strength <= 1) return 'bg-bf-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-bf-yellow-500';
    return 'bg-bf-green-500';
  }
  
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    return texts[strength] || '';
  }
  
  getPasswordStrengthTextClass(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 1) return 'text-bf-red-500';
    if (strength === 2) return 'text-orange-500';
    if (strength === 3) return 'text-bf-yellow-600';
    return 'text-bf-green-500';
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    
    const formValue = this.registerForm.value;
    const registerData = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      username: formValue.username,
      password: formValue.password,
      ministereId: formValue.ministereId || undefined
    };
    
    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.registerForm.reset();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue lors de l\'inscription.');
      }
    });
  }
}
