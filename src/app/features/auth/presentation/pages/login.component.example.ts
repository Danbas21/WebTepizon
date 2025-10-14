/**
 * Login Component (EJEMPLO)
 * 
 * Ejemplo completo de componente de login usando:
 * - Angular 20 standalone components
 * - Signals y computed signals
 * - Formularios reactivos
 * - AuthFacade para lógica de autenticación
 * - Control flow moderno (@if, @for)
 * 
 * Este es un ejemplo funcional que puedes usar como base en la Fase 4.
 */

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../application/auth.facade';
import { LoginUseCaseInput } from '../application/use-cases/login.use-case';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="header">
          <h1>Iniciar Sesión</h1>
          <p>Bienvenido de vuelta a Tepizon</p>
        </div>

        <!-- Formulario -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              [class.error]="emailError()"
            />
            @if (emailError()) {
              <span class="error-message">{{ emailError() }}</span>
            }
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              [type]="showPassword() ? 'text' : 'password'"
              id="password"
              formControlName="password"
              placeholder="••••••••"
              [class.error]="passwordError()"
            />
            <button
              type="button"
              class="toggle-password"
              (click)="togglePassword()"
            >
              {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
            </button>
            @if (passwordError()) {
              <span class="error-message">{{ passwordError() }}</span>
            }
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="form-options">
            <label class="checkbox">
              <input type="checkbox" formControlName="rememberMe" />
              Recordarme
            </label>
            <a routerLink="/auth/forgot-password" class="link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <!-- Error del servidor -->
          @if (authFacade.error()) {
            <div class="alert alert-error">
              {{ authFacade.error()?.message }}
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="isSubmitting() || !loginForm.valid"
          >
            @if (isSubmitting()) {
              <span class="spinner"></span>
              Iniciando sesión...
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span>o continúa con</span>
        </div>

        <!-- Social Login -->
        <button
          type="button"
          class="btn btn-google"
          (click)="loginWithGoogle()"
          [disabled]="isSubmitting()"
        >
          <img src="/assets/icons/google.svg" alt="Google" />
          Continuar con Google
        </button>

        <!-- Register Link -->
        <div class="footer">
          <p>
            ¿No tienes una cuenta?
            <a routerLink="/auth/register" class="link">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
      background: linear-gradient(135deg, #00100D 0%, #485318 100%);
    }

    .login-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #00100D;
      margin-bottom: 0.5rem;
    }

    .header p {
      color: #6B7280;
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
      position: relative;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    input[type="email"],
    input[type="password"],
    input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #00100D;
    }

    input.error {
      border-color: #EF4444;
    }

    .error-message {
      display: block;
      color: #EF4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      top: 2.25rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .link {
      color: #00100D;
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    .alert {
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #00100D;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1F2937;
    }

    .btn-google {
      background: white;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn-google:hover:not(:disabled) {
      background: #F9FAFB;
    }

    .btn-google img {
      width: 1.25rem;
      height: 1.25rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
      color: #9CA3AF;
      font-size: 0.875rem;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #E5E7EB;
    }

    .divider span {
      padding: 0 1rem;
    }

    .footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #6B7280;
    }
  `],
})
export class LoginComponent {
  // Inyección de dependencias
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authFacade = inject(AuthFacade);

  // Signals locales
  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);

  // Formulario reactivo
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  // Computed signals para errores
  readonly emailError = computed(() => {
    const control = this.loginForm.get('email');
    if (!control?.touched) return null;
    
    if (control.hasError('required')) {
      return 'El email es requerido';
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    return null;
  });

  readonly passwordError = computed(() => {
    const control = this.loginForm.get('password');
    if (!control?.touched) return null;
    
    if (control.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control.hasError('minlength')) {
      return 'Mínimo 6 caracteres';
    }
    return null;
  });

  /**
   * Maneja el submit del formulario
   */
  async onSubmit(): Promise<void> {
    // Marcar todos los campos como touched para mostrar errores
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    const input: LoginUseCaseInput = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe,
    };

    try {
      const result = await this.authFacade.login(input);

      if (result.success) {
        // Login exitoso - redirigir
        await this.authFacade.navigateToDefaultRoute();
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Login con Google
   */
  async loginWithGoogle(): Promise<void> {
    this.isSubmitting.set(true);
    try {
      await this.authFacade.loginWithGoogle();
      // El redirect ocurre, no llegamos aquí
    } catch (error) {
      console.error('Error en login con Google:', error);
      this.isSubmitting.set(false);
    }
  }

  /**
   * Toggle mostrar/ocultar contraseña
   */
  togglePassword(): void {
    this.showPassword.update(show => !show);
  }
}

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. Copia este archivo a: src/app/features/auth/presentation/pages/login.component.ts
 * 
 * 2. Crea la ruta en auth.routes.ts:
 * 
 * ```typescript
 * import { Routes } from '@angular/router';
 * import { LoginComponent } from './presentation/pages/login.component';
 * 
 * export const AUTH_ROUTES: Routes = [
 *   {
 *     path: 'login',
 *     component: LoginComponent,
 *   },
 * ];
 * ```
 * 
 * 3. Agrega el ícono de Google en public/assets/icons/google.svg
 * 
 * 4. Personaliza los estilos según tu design system
 * 
 * 5. Agrega transiciones y animaciones si lo deseas
 */
