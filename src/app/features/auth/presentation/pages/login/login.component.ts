// ============================================================================
// LOGIN COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página de inicio de sesión con email/password y social login
// ============================================================================

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';

// Services
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Componente de Login
 * 
 * Características:
 * - Login con email/password
 * - Login social (Google, Facebook)
 * - Validaciones en tiempo real
 * - Manejo de errores
 * - Recordar sesión
 * - Links a registro y recuperación de contraseña
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDividerModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
  ],
  template: `
    <div class="login-page">
      <div class="container">
        <div class="login-container">
          <!-- Left side - Image/Brand -->
          <div class="login-brand">
            <div class="brand-content">
              <h1 class="brand-name">TEPIZON</h1>
              <p class="brand-tagline">
                Tu tienda en línea de confianza
              </p>
              <div class="brand-features">
                <div class="feature">
                  <mat-icon>check_circle</mat-icon>
                  <span>Envío gratis en compras +$500</span>
                </div>
                <div class="feature">
                  <mat-icon>check_circle</mat-icon>
                  <span>30 días para devoluciones</span>
                </div>
                <div class="feature">
                  <mat-icon>check_circle</mat-icon>
                  <span>Pago 100% seguro</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right side - Login form -->
          <div class="login-form-container">
            <app-card variant="flat">
              <div cardContent class="login-content">
                <!-- Header -->
                <div class="login-header">
                  <h2 class="login-title">Iniciar Sesión</h2>
                  <p class="login-subtitle">
                    Bienvenido de vuelta
                  </p>
                </div>
                
                <!-- Social login -->
                <div class="social-login">
                  <app-button
                    variant="secondary"
                    [fullWidth]="true"
                    [disabled]="isLoading()"
                    (clicked)="loginWithGoogle()">
                    <span iconLeft>
                      <mat-icon>g_translate</mat-icon>
                    </span>
                    Continuar con Google
                  </app-button>
                  
                  <app-button
                    variant="secondary"
                    [fullWidth]="true"
                    [disabled]="isLoading()"
                    (clicked)="loginWithFacebook()">
                    <span iconLeft>
                      <mat-icon>facebook</mat-icon>
                    </span>
                    Continuar con Facebook
                  </app-button>
                </div>
                
                <mat-divider class="divider">
                  <span class="divider-text">O</span>
                </mat-divider>
                
                <!-- Email/Password form -->
                <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
                  <!-- Email -->
                  <app-input
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    iconLeft="email"
                    [required]="true"
                    [error]="getFieldError('email')"
                    formControlName="email"
                    autocomplete="email">
                  </app-input>
                  
                  <!-- Password -->
                  <app-input
                    label="Contraseña"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    [required]="true"
                    [error]="getFieldError('password')"
                    formControlName="password"
                    autocomplete="current-password">
                  </app-input>
                  
                  <!-- Remember me & Forgot password -->
                  <div class="form-options">
                    <label class="remember-me">
                      <input 
                        type="checkbox" 
                        formControlName="rememberMe" />
                      <span>Recordarme</span>
                    </label>
                    
                    <a 
                      routerLink="/auth/forgot-password" 
                      class="forgot-password">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  
                  <!-- Submit button -->
                  <app-button
                    type="submit"
                    variant="primary"
                    size="lg"
                    [fullWidth]="true"
                    [loading]="isLoading()"
                    [disabled]="loginForm.invalid || isLoading()">
                    Iniciar Sesión
                  </app-button>
                  
                  <!-- Error message -->
                  @if (errorMessage()) {
                    <div class="error-alert">
                      <mat-icon>error</mat-icon>
                      <span>{{ errorMessage() }}</span>
                    </div>
                  }
                </form>
                
                <!-- Register link -->
                <div class="register-link">
                  <span>¿No tienes cuenta?</span>
                  <a routerLink="/auth/register">Crear cuenta</a>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // PAGE LAYOUT
    // ========================================================================
    
    .login-page {
      min-height: 100vh;
      padding: spacing('8') 0;
      background: linear-gradient(135deg, $neutral-50 0%, $neutral-100 100%);
      
      :host-context(.dark-theme) & {
        background: linear-gradient(135deg, $neutral-900 0%, $neutral-1000 100%);
      }
      
      @include mobile-only {
        padding: spacing('4') 0;
      }
    }
    
    .login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: spacing('8');
      max-width: 1200px;
      margin: 0 auto;
      
      @include respond-below('lg') {
        grid-template-columns: 1fr;
        gap: spacing('6');
      }
    }
    
    // ========================================================================
    // BRAND SIDE
    // ========================================================================
    
    .login-brand {
      @include flex-center;
      padding: spacing('8');
      
      @include respond-below('lg') {
        display: none;
      }
    }
    
    .brand-content {
      @include flex-column;
      gap: spacing('8');
      max-width: 400px;
    }
    
    .brand-name {
      @include heading-1;
      color: $primary-1000;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $primary-300;
      }
    }
    
    .brand-tagline {
      @include body-large;
      color: $neutral-700;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
    }
    
    .brand-features {
      @include flex-column;
      gap: spacing('4');
    }
    
    .feature {
      @include flex-start;
      gap: spacing('3');
      color: $neutral-800;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
      
      mat-icon {
        color: $success;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      
      span {
        @include body-base;
      }
    }
    
    // ========================================================================
    // FORM SIDE
    // ========================================================================
    
    .login-form-container {
      @include flex-center;
      padding: spacing('4');
      
      @include mobile-only {
        padding: spacing('2');
      }
    }
    
    .login-content {
      width: 100%;
      max-width: 480px;
      padding: spacing('8');
      
      @include mobile-only {
        padding: spacing('6');
      }
    }
    
    // ========================================================================
    // HEADER
    // ========================================================================
    
    .login-header {
      @include flex-column;
      gap: spacing('2');
      margin-bottom: spacing('8');
      text-align: center;
    }
    
    .login-title {
      @include heading-3;
      margin: 0;
    }
    
    .login-subtitle {
      @include body-base;
      color: $neutral-600;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // SOCIAL LOGIN
    // ========================================================================
    
    .social-login {
      @include flex-column;
      gap: spacing('3');
      margin-bottom: spacing('6');
    }
    
    // ========================================================================
    // DIVIDER
    // ========================================================================
    
    .divider {
      margin: spacing('6') 0;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background-color: $neutral-300;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-700;
        }
      }
    }
    
    .divider-text {
      position: relative;
      display: inline-block;
      padding: 0 spacing('4');
      background-color: $neutral-0;
      color: $neutral-500;
      font-size: font-size('sm');
      z-index: 1;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
    }
    
    // ========================================================================
    // FORM
    // ========================================================================
    
    .login-form {
      @include flex-column;
      gap: spacing('5');
    }
    
    .form-options {
      @include flex-between;
      align-items: center;
      
      @include mobile-only {
        flex-direction: column;
        align-items: flex-start;
        gap: spacing('3');
      }
    }
    
    .remember-me {
      @include flex-start;
      gap: spacing('2');
      cursor: pointer;
      font-size: font-size('sm');
      color: $neutral-700;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
      
      input[type="checkbox"] {
        cursor: pointer;
      }
    }
    
    .forgot-password {
      font-size: font-size('sm');
      color: $primary-1000;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
      
      :host-context(.dark-theme) & {
        color: $primary-300;
      }
    }
    
    // ========================================================================
    // ERROR ALERT
    // ========================================================================
    
    .error-alert {
      @include flex-start;
      gap: spacing('2');
      padding: spacing('3') spacing('4');
      background-color: $error-lighter;
      border-radius: radius('base');
      color: $error-dark;
      font-size: font-size('sm');
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    // ========================================================================
    // REGISTER LINK
    // ========================================================================
    
    .register-link {
      @include flex-center;
      gap: spacing('2');
      margin-top: spacing('6');
      font-size: font-size('sm');
      color: $neutral-700;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
      
      a {
        color: $primary-1000;
        font-weight: $font-weight-medium;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
        
        :host-context(.dark-theme) & {
          color: $primary-300;
        }
      }
    }
  `]
})
export class LoginComponent {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Estado de carga */
  readonly isLoading = signal(false);
  
  /** Mensaje de error */
  readonly errorMessage = signal('');
  
  // ========================================================================
  // FORM
  // ========================================================================
  
  /** Formulario de login */
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar submit del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      const { email, password, rememberMe } = this.loginForm.value;
      
      // TODO: Llamar al AuthFacade para login
      // await this.authFacade.login(email, password, rememberMe);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Login exitoso:', { email, rememberMe });
      
      this.toast.welcome('Usuario');
      this.router.navigate(['/']);
      
    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage.set(
        error.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.'
      );
      this.toast.error('Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Login con Google
   */
  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // TODO: Implementar login con Google
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Login con Google');
      this.toast.success('Iniciando sesión con Google...');
      
      // Redirigir después del login
      // this.router.navigate(['/']);
      
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      this.errorMessage.set('Error al iniciar sesión con Google');
      this.toast.error('Error al iniciar sesión con Google');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Login con Facebook
   */
  async loginWithFacebook(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // TODO: Implementar login con Facebook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Login con Facebook');
      this.toast.success('Iniciando sesión con Facebook...');
      
      // Redirigir después del login
      // this.router.navigate(['/']);
      
    } catch (error: any) {
      console.error('Error en login con Facebook:', error);
      this.errorMessage.set('Error al iniciar sesión con Facebook');
      this.toast.error('Error al iniciar sesión con Facebook');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Obtener mensaje de error de un campo
   */
  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    
    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    
    if (control.errors['email']) {
      return 'Email inválido';
    }
    
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    return 'Campo inválido';
  }
}
