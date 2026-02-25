import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);
    apiServiceSpy.get.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have registration form', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.contains('nom')).toBeTrue();
    expect(component.registerForm.contains('prenom')).toBeTrue();
    expect(component.registerForm.contains('email')).toBeTrue();
    expect(component.registerForm.contains('username')).toBeTrue();
    expect(component.registerForm.contains('password')).toBeTrue();
    expect(component.registerForm.contains('confirmPassword')).toBeTrue();
    expect(component.registerForm.contains('acceptTerms')).toBeTrue();
    expect(component.registerForm.contains('ministereId')).toBeTrue();
  });

  it('should validate required fields', () => {
    component.registerForm.setValue({
      nom: '',
      prenom: '',
      email: '',
      username: '',
      ministereId: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });
    component.registerForm.markAllAsTouched();

    expect(component.registerForm.valid).toBeFalse();
    expect(component.isFieldInvalid('nom')).toBeTrue();
    expect(component.isFieldInvalid('prenom')).toBeTrue();
    expect(component.isFieldInvalid('email')).toBeTrue();
    expect(component.isFieldInvalid('username')).toBeTrue();
    expect(component.isFieldInvalid('password')).toBeTrue();
    expect(component.isFieldInvalid('acceptTerms')).toBeTrue();
  });

  it('should validate password match', () => {
    component.registerForm.patchValue({
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password1',
      confirmPassword: 'DifferentPassword1',
      acceptTerms: true
    });
    component.registerForm.markAllAsTouched();

    expect(component.isFieldInvalid('confirmPassword')).toBeTrue();
  });

  it('should call register service on submit', () => {
    authServiceSpy.register.and.returnValue(of({}));

    component.registerForm.setValue({
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      username: 'johndoe',
      ministereId: '',
      password: 'Password1',
      confirmPassword: 'Password1',
      acceptTerms: true
    });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password1',
      ministereId: undefined
    });
  });
});
