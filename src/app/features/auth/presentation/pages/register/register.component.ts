// ============================================================================
// REGISTER COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página de registro de nuevos usuarios
// ============================================================================

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';

// Services
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Componente de Registro
 * 
 * Características:
 * - Registro con email/password
 * - Validaciones complejas (contraseñas coinciden, términos aceptados)
 * - Indicador de fortaleza de contraseña
 * - Manejo de errores
 * - Links a login y términos
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDividerModule,
    MatCheckboxModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
  ],
  template: `
    <div class="register-page">
      <div class="container">
        <div class="register-container">
          <!-- Header -->
          <div class="register-header">
            <h1 class="register-title">Crear Cuenta</h1>
            <p class="register-subtitle">
              Únete a Tepizon y comienza a comprar
            </p>
          </div>
          
          <!-- Register card -->
          <app-card variant="elevated">
            <div cardContent class="register-content">
              <!-- Social register -->
              <div class="social-register">
                <app-button
                  variant="secondary"
                  [fullWidth]="true"
                  [disabled]="isLoading()"
                  (clicked)="registerWithGoogle()">
                  <span iconLeft>
                    <mat-icon>g_translate</mat-icon>
                  </span>
                  Registrarse con Google
                </app-button>
                
                <app-button
                  variant="secondary"
                  [fullWidth]="true"
                  [disabled]="isLoading()"
                  (clicked)="registerWithFacebook()">
                  <span iconLeft>
                    <mat-icon>facebook</mat-icon>
                  </span>
                  Registrarse con Facebook
                </app-button>
              </div>
              
              <mat-divider class="divider">
                <span class="divider-text">O</span>
              </mat-divider>
              
              <!-- Register form -->
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
                <!-- Name -->
                <app-input
                  label="Nombre completo"
                  type="text"
                  placeholder="Juan Pérez"
                  iconLeft="person"
                  [required]="true"
                  [error]="getFieldError('name')"
                  formControlName="name"
                  autocomplete="name">
                </app-input>
                
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
                <div class="password-field">
                  <app-input
                    label="Contraseña"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    [required]="true"
                    [error]="getFieldError('password')"
                    formControlName="password"
                    autocomplete="new-password">
                  </app-input>
                  
                  <!-- Password strength indicator -->
                  @if (registerForm.get('password')?.value) {
                    <div class="password-strength">
                      <div class="strength-bar">
                        <div 
                          class="strength-fill"
                          [class]="'strength-' + passwordStrength()">
                        </div>
                      </div>
                      <span class="strength-text">
                        {{ passwordStrengthText() }}
                      </span>
                    </div>
                  }
                </div>
                
                <!-- Confirm Password -->
                <app-input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite tu contraseña"
                  [required]="true"
                  [error]="getFieldError('confirmPassword')"
                  formControlName="confirmPassword"
                  autocomplete="new-password">
                </app-input>
                
                <!-- Terms and conditions -->
                <div class="terms-checkbox">
                  <mat-checkbox formControlName="acceptTerms" color="primary">
                    <span class="terms-text">
                      Acepto los
                      <a routerLink="/terms" target="_blank">Términos y Condiciones</a>
                      y la
                      <a routerLink="/privacy" target="_blank">Política de Privacidad</a>
                    </span>
                  </mat-checkbox>
                  @if (getFieldError('acceptTerms')) {
                    <span class="terms-error">{{ getFieldError('acceptTerms') }}</span>
                  }
                </div>
                
                <!-- Newsletter subscription -->
                <div class="newsletter-checkbox">
                  <mat-checkbox formControlName="subscribeNewsletter" color="primary">
                    <span class="newsletter-text">
                      Quiero recibir ofertas y novedades por email
                    </span>
                  </mat-checkbox>
                </div>
                
                <!-- Submit button -->
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="isLoading()"
                  [disabled]="registerForm.invalid || isLoading()">
                  Crear Cuenta
                </app-button>
                
                <!-- Error message -->
                @if (errorMessage()) {
                  <div class="error-alert">
                    <mat-icon>error</mat-icon>
                    <span>{{ errorMessage() }}</span>
                  </div>
                }
              </form>
              
              <!-- Login link -->
              <div class="login-link">
                <span>¿Ya tienes cuenta?</span>
                <a routerLink="/auth/login">Iniciar sesión</a>
              </div>
            </div>
          </app-card>
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
    
    .register-page {
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
    
    .register-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    // ========================================================================
    // HEADER
    // ========================================================================
    
    .register-header {
      @include flex-column;
      gap: spacing('2');
      margin-bottom: spacing('6');
      text-align: center;
    }
    
    .register-title {
      @include heading-2;
      margin: 0;
      
      @include mobile-only {
        font-size: font-size('3xl');
      }
    }
    
    .register-subtitle {
      @include body-large;
      color: $neutral-700;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
    }
    
    // ========================================================================
    // CONTENT
    // ========================================================================
    
    .register-content {
      padding: spacing('8');
      
      @include mobile-only {
        padding: spacing('6');
      }
    }
    
    // ========================================================================
    // SOCIAL REGISTER
    // ========================================================================
    
    .social-register {
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
    
    .register-form {
      @include flex-column;
      gap: spacing('5');
    }
    
    // ========================================================================
    // PASSWORD STRENGTH
    // ========================================================================
    
    .password-field {
      @include flex-column;
      gap: spacing('2');
    }
    
    .password-strength {
      @include flex-column;
      gap: spacing('2');
    }
    
    .strength-bar {
      width: 100%;
      height: 4px;
      background-color: $neutral-200;
      border-radius: radius('full');
      overflow: hidden;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-700;
      }
    }
    
    .strength-fill {
      height: 100%;
      transition: all $transition-speed-base $transition-timing;
      border-radius: radius('full');
      
      &.strength-weak {
        width: 33%;
        background-color: $error;
      }
      
      &.strength-medium {
        width: 66%;
        background-color: $warning;
      }
      
      &.strength-strong {
        width: 100%;
        background-color: $success;
      }
    }
    
    .strength-text {
      @include body-xs;
      font-weight: $font-weight-medium;
      
      .strength-weak & {
        color: $error;
      }
      
      .strength-medium & {
        color: $warning;
      }
      
      .strength-strong & {
        color: $success;
      }
    }
    
    // ========================================================================
    // CHECKBOXES
    // ========================================================================
    
    .terms-checkbox,
    .newsletter-checkbox {
      @include flex-column;
      gap: spacing('1');
    }
    
    .terms-text,
    .newsletter-text {
      @include body-sm;
      color: $neutral-700;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
      
      a {
        color: $primary-1000;
        text-decoration: none;
        font-weight: $font-weight-medium;
        
        &:hover {
          text-decoration: underline;
        }
        
        :host-context(.dark-theme) & {
          color: $primary-300;
        }
      }
    }
    
    .terms-error {
      @include body-xs;
      color: $error;
      margin-left: spacing('8');
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
    // LOGIN LINK
    // ========================================================================
    
    .login-link {
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
export class RegisterComponent {
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
  
  /** Fortaleza de la contraseña */
  readonly passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');
  
  /** Texto de fortaleza de contraseña */
  readonly passwordStrengthText = signal('Débil');
  
  // ========================================================================
  // FORM
  // ========================================================================
  
  /** Formulario de registro */
  readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
    subscribeNewsletter: [true]
  }, {
    validators: [this.passwordMatchValidator]
  });
  
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  
  constructor() {
    // Observar cambios en la contraseña para calcular fortaleza
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar submit del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      const { name, email, password, subscribeNewsletter } = this.registerForm.value;
      
      // TODO: Llamar al AuthFacade para registro
      // await this.authFacade.register(name, email, password, subscribeNewsletter);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Registro exitoso:', { name, email, subscribeNewsletter });
      
      this.toast.success('Cuenta creada exitosamente');
      this.router.navigate(['/auth/login']);
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      this.errorMessage.set(
        error.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.'
      );
      this.toast.error('Error al crear la cuenta');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Registro con Google
   */
  async registerWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // TODO: Implementar registro con Google
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Registro con Google');
      this.toast.success('Registrando con Google...');
      
    } catch (error: any) {
      console.error('Error en registro con Google:', error);
      this.errorMessage.set('Error al registrarse con Google');
      this.toast.error('Error al registrarse con Google');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Registro con Facebook
   */
  async registerWithFacebook(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // TODO: Implementar registro con Facebook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Registro con Facebook');
      this.toast.success('Registrando con Facebook...');
      
    } catch (error: any) {
      console.error('Error en registro con Facebook:', error);
      this.errorMessage.set('Error al registrarse con Facebook');
      this.toast.error('Error al registrarse con Facebook');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Obtener mensaje de error de un campo
   */
  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    
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
    
    if (control.errors['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    
    if (control.errors['requiredTrue']) {
      return 'Debes aceptar los términos y condiciones';
    }
    
    return 'Campo inválido';
  }
  
  /**
   * Calcular fortaleza de la contraseña
   */
  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set('weak');
      this.passwordStrengthText.set('Débil');
      return;
    }
    
    let strength = 0;
    
    // Longitud
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Tiene números
    if (/\d/.test(password)) strength++;
    
    // Tiene minúsculas y mayúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    
    // Tiene caracteres especiales
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Determinar nivel
    if (strength <= 2) {
      this.passwordStrength.set('weak');
      this.passwordStrengthText.set('Débil');
    } else if (strength <= 4) {
      this.passwordStrength.set('medium');
      this.passwordStrengthText.set('Media');
    } else {
      this.passwordStrength.set('strong');
      this.passwordStrengthText.set('Fuerte');
    }
  }
  
  /**
   * Validador personalizado para contraseñas coincidentes
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    if (confirmPassword.value === '') {
      return null;
    }
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Limpiar error de mismatch si coinciden
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }
}
