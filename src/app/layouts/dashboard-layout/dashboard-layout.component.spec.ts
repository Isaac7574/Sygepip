import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { AuthService } from '@core/services/auth.service';
import { signal } from '@angular/core';

describe('DashboardLayoutComponent', () => {
  let component: DashboardLayoutComponent;
  let fixture: ComponentFixture<DashboardLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: 1,
    prenom: 'Jean',
    nom: 'DUPONT',
    email: 'jean.dupont@test.com',
    role: 'ADMIN'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout', 'currentUser', 'isAuthenticated']);
    authSpy.currentUser.and.returnValue(mockUser);
    authSpy.isAuthenticated.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(DashboardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have sidebar navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sidebar = compiled.querySelector('aside');
    expect(sidebar).toBeTruthy();

    const navLinks = compiled.querySelectorAll('.nav-link');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should toggle sidebar', () => {
    expect(component.sidebarOpen()).toBeTrue();

    component.toggleSidebar();
    expect(component.sidebarOpen()).toBeFalse();

    component.toggleSidebar();
    expect(component.sidebarOpen()).toBeTrue();
  });

  it('should toggle user menu', () => {
    expect(component.userMenuOpen()).toBeFalse();

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBeTrue();

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBeFalse();
  });

  it('should get user initials', () => {
    const initials = component.getUserInitials();
    expect(initials).toBeTruthy();
    expect(initials.length).toBeGreaterThanOrEqual(1);
    expect(initials.length).toBeLessThanOrEqual(2);
  });

  it('should return default initial when no user', () => {
    authService.currentUser.and.returnValue(null);
    const initials = component.getUserInitials();
    expect(initials).toBe('U');
  });

  it('should logout', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should display sidebar logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('aside h1');
    expect(logo?.textContent?.trim()).toBe('SYGEPIP');
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should display navigation sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sectionTitles = compiled.querySelectorAll('.text-xs.font-semibold.text-gray-400');
    expect(sectionTitles.length).toBeGreaterThan(0);
  });
});
