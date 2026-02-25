import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have login form with username and password', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.contains('username')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
    expect(component.loginForm.contains('rememberMe')).toBeTrue();
  });

  it('should mark form invalid when empty', () => {
    component.loginForm.setValue({
      username: '',
      password: '',
      rememberMe: false
    });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should call auth service on submit', () => {
    const mockResponse = { token: 'mock-jwt-token', user: { id: 1, username: 'testuser', role: 'USER' } };
    authServiceSpy.login.and.returnValue(of(mockResponse as any));

    component.loginForm.setValue({
      username: 'testuser',
      password: 'password123',
      rememberMe: false
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });

  it('should show error on failed login', () => {
    const errorMessage = 'Identifiants incorrects';
    authServiceSpy.login.and.returnValue(throwError(() => ({ message: errorMessage })));

    component.loginForm.setValue({
      username: 'wronguser',
      password: 'wrongpass',
      rememberMe: false
    });

    component.onSubmit();

    expect(component.error()).toBe(errorMessage);
    expect(component.loading()).toBeFalse();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });
});
