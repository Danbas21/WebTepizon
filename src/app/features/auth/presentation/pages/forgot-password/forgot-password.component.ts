// ============================================================================
// FORGOT PASSWORD COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página para recuperación de contraseña
// ============================================================================

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';

// Services
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Componente de Recuperación de Contraseña
 * 
 * Características:
 * - Solicitar email para reset
 * - Confirmación visual de envío
 * - Link de vuelta a login
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
  ],
  template: `
    <div class="forgot-password-page">
      <div class="container">
        <div class="forgot-password-container">
          <app-card variant="elevated">
            <div cardContent class="content">
              @if (!emailSent()) {
                <!-- Request reset form -->
                <div class="reset-request">
                  <!-- Icon -->
                  <div class="icon-container">
                    <mat-icon>lock_reset</mat-icon>
                  </div>
                  
                  <!-- Header -->
                  <div class="header">
                    <h2 class="title">¿Olvidaste tu contraseña?</h2>
                    <p class="subtitle">
                      No te preocupes, te enviaremos instrucciones para recuperarla
                    </p>
                  </div>
                  
                  <!-- Form -->
                  <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
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
                    
                    <app-button
                      type="submit"
                      variant="primary"
                      size="lg"
                      [fullWidth]="true"
                      [loading]="isLoading()"
                      [disabled]="resetForm.invalid || isLoading()">
                      Enviar Instrucciones
                    </app-button>
                    
                    @if (errorMessage()) {
                      <div class="error-alert">
                        <mat-icon>error</mat-icon>
                        <span>{{ errorMessage() }}</span>
                      </div>
                    }
                  </form>
                  
                  <!-- Back to login -->
                  <div class="back-link">
                    <a routerLink="/auth/login">
                      <mat-icon>arrow_back</mat-icon>
                      <span>Volver a iniciar sesión</span>
                    </a>
                  </div>
                </div>
              } @else {
                <!-- Success message -->
                <div class="success-message">
                  <!-- Icon -->
                  <div class="success-icon">
                    <mat-icon>mark_email_read</mat-icon>
                  </div>
                  
                  <!-- Message -->
                  <div class="success-content">
                    <h2 class="success-title">¡Email Enviado!</h2>
                    <p class="success-text">
                      Hemos enviado las instrucciones de recuperación a
                      <strong>{{ resetForm.value.email }}</strong>
                    </p>
                    <p class="success-hint">
                      Por favor, revisa tu bandeja de entrada y spam.
                      El link expirará en 1 hora.
                    </p>
                  </div>
                  
                  <!-- Actions -->
                  <div class="success-actions">
                    <app-button
                      variant="primary"
                      size="lg"
                      [fullWidth]="true"
                      routerLink="/auth/login">
                      Ir a Iniciar Sesión
                    </app-button>
                    
                    <app-button
                      variant="ghost"
                      [fullWidth]="true"
                      (clicked)="resendEmail()">
                      Reenviar Email
                    </app-button>
                  </div>
                </div>
              }
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
    
    .forgot-password-page {
      min-height: 100vh;
      @include flex-center;
      padding: spacing('8') 0;
      background: linear-gradient(135deg, $neutral-50 0%, $neutral-100 100%);
      
      :host-context(.dark-theme) & {
        background: linear-gradient(135deg, $neutral-900 0%, $neutral-1000 100%);
      }
      
      @include mobile-only {
        padding: spacing('4') 0;
      }
    }
    
    .forgot-password-container {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
    }
    
    .content {
      padding: spacing('8');
      
      @include mobile-only {
        padding: spacing('6');
      }
    }
    
    // ========================================================================
    // RESET REQUEST
    // ========================================================================
    
    .reset-request {
      @include flex-column;
      gap: spacing('6');
      align-items: center;
    }
    
    .icon-container {
      width: 80px;
      height: 80px;
      @include flex-center;
      background: linear-gradient(135deg, $primary-1000 0%, $primary-700 100%);
      border-radius: radius('full');
      
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: $neutral-0;
      }
    }
    
    .header {
      @include flex-column;
      gap: spacing('2');
      text-align: center;
    }
    
    .title {
      @include heading-3;
      margin: 0;
      
      @include mobile-only {
        font-size: font-size('2xl');
      }
    }
    
    .subtitle {
      @include body-base;
      color: $neutral-600;
      margin: 0;
      max-width: 320px;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // FORM
    // ========================================================================
    
    .reset-form {
      @include flex-column;
      gap: spacing('5');
      width: 100%;
    }
    
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
    // BACK LINK
    // ========================================================================
    
    .back-link {
      width: 100%;
      
      a {
        @include flex-center;
        gap: spacing('2');
        color: $neutral-700;
        text-decoration: none;
        font-size: font-size('sm');
        transition: color $transition-speed-fast $transition-timing;
        
        :host-context(.dark-theme) & {
          color: $neutral-300;
        }
        
        &:hover {
          color: $primary-1000;
          
          :host-context(.dark-theme) & {
            color: $primary-300;
          }
        }
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }
    
    // ========================================================================
    // SUCCESS MESSAGE
    // ========================================================================
    
    .success-message {
      @include flex-column;
      gap: spacing('6');
      align-items: center;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      @include flex-center;
      background-color: $success-lighter;
      border-radius: radius('full');
      
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: $success-dark;
      }
    }
    
    .success-content {
      @include flex-column;
      gap: spacing('3');
      text-align: center;
    }
    
    .success-title {
      @include heading-3;
      color: $success-dark;
      margin: 0;
      
      @include mobile-only {
        font-size: font-size('2xl');
      }
    }
    
    .success-text {
      @include body-base;
      margin: 0;
      
      strong {
        color: $primary-1000;
        font-weight: $font-weight-semibold;
        
        :host-context(.dark-theme) & {
          color: $primary-300;
        }
      }
    }
    
    .success-hint {
      @include body-small;
      color: $neutral-600;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    .success-actions {
      @include flex-column;
      gap: spacing('3');
      width: 100%;
    }
  `]
})
export class ForgotPasswordComponent {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Estado de carga */
  readonly isLoading = signal(false);
  
  /** Email enviado */
  readonly emailSent = signal(false);
  
  /** Mensaje de error */
  readonly errorMessage = signal('');
  
  // ========================================================================
  // FORM
  // ========================================================================
  
  /** Formulario de reset */
  readonly resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar submit del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      const { email } = this.resetForm.value;
      
      // TODO: Llamar al AuthFacade para reset de contraseña
      // await this.authFacade.requestPasswordReset(email);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Reset password solicitado para:', email);
      
      this.emailSent.set(true);
      this.toast.success('Email enviado correctamente');
      
    } catch (error: any) {
      console.error('Error al solicitar reset:', error);
      this.errorMessage.set(
        error.message || 'Error al enviar el email. Por favor, verifica la dirección.'
      );
      this.toast.error('Error al enviar el email');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Reenviar email
   */
  async resendEmail(): Promise<void> {
    this.emailSent.set(false);
    
    // Pequeño delay para que el usuario vea el cambio
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.onSubmit();
  }
  
  /**
   * Obtener mensaje de error de un campo
   */
  getFieldError(fieldName: string): string {
    const control = this.resetForm.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    
    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    
    if (control.errors['email']) {
      return 'Email inválido';
    }
    
    return 'Campo inválido';
  }
}
