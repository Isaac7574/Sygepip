import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have email form', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
  });

  it('should validate email required', () => {
    const email = component.form.get('email');
    email?.setValue('');
    expect(email?.valid).toBeFalse();
  });

  it('should validate email format', () => {
    const email = component.form.get('email');
    email?.setValue('invalid');
    expect(email?.valid).toBeFalse();
    email?.setValue('test@example.com');
    expect(email?.valid).toBeTrue();
  });

  it('should not submit if form is invalid', () => {
    component.form.get('email')?.setValue('');
    component.onSubmit();
    expect(component.loading()).toBeFalse();
  });

  it('should have loading signal initially false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should have success signal initially false', () => {
    expect(component.success()).toBeFalse();
  });

  it('should have error signal initially empty', () => {
    expect(component.error()).toBe('');
  });
});
