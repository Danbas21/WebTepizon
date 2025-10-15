// ============================================================================
// PROFILE COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página de perfil del usuario con edición de datos
// ============================================================================

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

// Services
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Interfaz de usuario
 */
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  createdAt: Date;
  emailVerified: boolean;
}

/**
 * Componente de Perfil de Usuario
 * 
 * Características:
 * - Ver información del perfil
 * - Editar datos personales
 * - Cambiar contraseña
 * - Ver estadísticas de cuenta
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTabsModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
    BadgeComponent,
  ],
  template: `
    <div class="profile-page">
      <div class="container">
        <!-- Header -->
        <div class="profile-header">
          <h1 class="page-title">Mi Perfil</h1>
          <p class="page-subtitle">
            Administra tu información personal y preferencias
          </p>
        </div>
        
        <!-- Content -->
        <div class="profile-content">
          <!-- Sidebar - User card -->
          <aside class="profile-sidebar">
            <app-card variant="elevated">
              <div cardContent class="user-card">
                <!-- Avatar -->
                <div class="user-avatar">
                  @if (user()?.photoURL) {
                    <img [src]="user()!.photoURL" [alt]="user()!.name" />
                  } @else {
                    <div class="avatar-placeholder">
                      <mat-icon>person</mat-icon>
                    </div>
                  }
                  
                  <button class="avatar-edit" type="button">
                    <mat-icon>photo_camera</mat-icon>
                  </button>
                </div>
                
                <!-- User info -->
                <div class="user-info">
                  <h2 class="user-name">{{ user()?.name }}</h2>
                  <p class="user-email">{{ user()?.email }}</p>
                  
                  @if (user()?.emailVerified) {
                    <app-badge variant="success" size="sm">
                      <mat-icon iconLeft style="font-size: 14px;">verified</mat-icon>
                      Verificado
                    </app-badge>
                  } @else {
                    <app-badge variant="warning" size="sm">
                      No verificado
                    </app-badge>
                  }
                </div>
                
                <!-- Stats -->
                <div class="user-stats">
                  <div class="stat">
                    <span class="stat-value">{{ orderCount() }}</span>
                    <span class="stat-label">Órdenes</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ wishlistCount() }}</span>
                    <span class="stat-label">Favoritos</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ reviewCount() }}</span>
                    <span class="stat-label">Reseñas</span>
                  </div>
                </div>
                
                <!-- Quick links -->
                <div class="quick-links">
                  <a routerLink="/orders" class="quick-link">
                    <mat-icon>receipt_long</mat-icon>
                    <span>Mis Órdenes</span>
                  </a>
                  <a routerLink="/wishlist" class="quick-link">
                    <mat-icon>favorite</mat-icon>
                    <span>Lista de Deseos</span>
                  </a>
                  <a routerLink="/profile/addresses" class="quick-link">
                    <mat-icon>location_on</mat-icon>
                    <span>Direcciones</span>
                  </a>
                </div>
              </div>
            </app-card>
          </aside>
          
          <!-- Main content - Forms -->
          <main class="profile-main">
            <mat-tab-group>
              <!-- Personal info tab -->
              <mat-tab label="Información Personal">
                <div class="tab-content">
                  <app-card variant="flat">
                    <div cardContent>
                      <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="profile-form">
                        <h3 class="form-title">Datos Personales</h3>
                        
                        <!-- Name -->
                        <app-input
                          label="Nombre completo"
                          type="text"
                          placeholder="Juan Pérez"
                          iconLeft="person"
                          [required]="true"
                          [error]="getFieldError('name', profileForm)"
                          formControlName="name">
                        </app-input>
                        
                        <!-- Email -->
                        <app-input
                          label="Email"
                          type="email"
                          placeholder="tu@email.com"
                          iconLeft="email"
                          [required]="true"
                          [readonly]="true"
                          [error]="getFieldError('email', profileForm)"
                          formControlName="email"
                          helperText="El email no puede ser modificado">
                        </app-input>
                        
                        <!-- Phone -->
                        <app-input
                          label="Teléfono"
                          type="tel"
                          placeholder="55 1234 5678"
                          iconLeft="phone"
                          [error]="getFieldError('phone', profileForm)"
                          formControlName="phone">
                        </app-input>
                        
                        <!-- Actions -->
                        <div class="form-actions">
                          <app-button
                            type="submit"
                            variant="primary"
                            [loading]="isUpdating()"
                            [disabled]="profileForm.invalid || profileForm.pristine || isUpdating()">
                            Guardar Cambios
                          </app-button>
                          
                          <app-button
                            type="button"
                            variant="ghost"
                            [disabled]="profileForm.pristine"
                            (clicked)="resetProfileForm()">
                            Cancelar
                          </app-button>
                        </div>
                      </form>
                    </div>
                  </app-card>
                </div>
              </mat-tab>
              
              <!-- Security tab -->
              <mat-tab label="Seguridad">
                <div class="tab-content">
                  <app-card variant="flat">
                    <div cardContent>
                      <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="password-form">
                        <h3 class="form-title">Cambiar Contraseña</h3>
                        
                        <!-- Current password -->
                        <app-input
                          label="Contraseña actual"
                          type="password"
                          placeholder="Contraseña actual"
                          [required]="true"
                          [error]="getFieldError('currentPassword', passwordForm)"
                          formControlName="currentPassword">
                        </app-input>
                        
                        <!-- New password -->
                        <app-input
                          label="Nueva contraseña"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          [required]="true"
                          [error]="getFieldError('newPassword', passwordForm)"
                          formControlName="newPassword">
                        </app-input>
                        
                        <!-- Confirm new password -->
                        <app-input
                          label="Confirmar nueva contraseña"
                          type="password"
                          placeholder="Repite la nueva contraseña"
                          [required]="true"
                          [error]="getFieldError('confirmNewPassword', passwordForm)"
                          formControlName="confirmNewPassword">
                        </app-input>
                        
                        <!-- Actions -->
                        <div class="form-actions">
                          <app-button
                            type="submit"
                            variant="primary"
                            [loading]="isChangingPassword()"
                            [disabled]="passwordForm.invalid || isChangingPassword()">
                            Cambiar Contraseña
                          </app-button>
                        </div>
                      </form>
                    </div>
                  </app-card>
                </div>
              </mat-tab>
            </mat-tab-group>
          </main>
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
    
    .profile-page {
      padding: spacing('8') 0;
      min-height: 100vh;
      
      @include mobile-only {
        padding: spacing('4') 0;
      }
    }
    
    // ========================================================================
    // HEADER
    // ========================================================================
    
    .profile-header {
      margin-bottom: spacing('8');
      
      @include mobile-only {
        margin-bottom: spacing('6');
      }
    }
    
    .page-title {
      @include heading-2;
      margin: 0 0 spacing('2') 0;
      
      @include mobile-only {
        font-size: font-size('3xl');
      }
    }
    
    .page-subtitle {
      @include body-base;
      color: $neutral-600;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // CONTENT LAYOUT
    // ========================================================================
    
    .profile-content {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: spacing('8');
      
      @include respond-below('lg') {
        grid-template-columns: 1fr;
        gap: spacing('6');
      }
    }
    
    // ========================================================================
    // USER CARD (SIDEBAR)
    // ========================================================================
    
    .user-card {
      @include flex-column;
      align-items: center;
      gap: spacing('6');
      padding: spacing('8');
    }
    
    .user-avatar {
      position: relative;
      width: 120px;
      height: 120px;
      
      img,
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: radius('full');
        object-fit: cover;
      }
      
      .avatar-placeholder {
        @include flex-center;
        background: linear-gradient(135deg, $primary-1000 0%, $primary-700 100%);
        color: $neutral-0;
        
        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }
    }
    
    .avatar-edit {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 36px;
      height: 36px;
      @include flex-center;
      background-color: $primary-1000;
      border: 3px solid $neutral-0;
      border-radius: radius('full');
      cursor: pointer;
      transition: all $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        border-color: $neutral-800;
      }
      
      mat-icon {
        color: $neutral-0;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        transform: scale(1.1);
      }
    }
    
    .user-info {
      @include flex-column;
      align-items: center;
      gap: spacing('2');
      text-align: center;
    }
    
    .user-name {
      @include heading-4;
      margin: 0;
    }
    
    .user-email {
      @include body-small;
      color: $neutral-600;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // USER STATS
    // ========================================================================
    
    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: spacing('4');
      width: 100%;
      padding: spacing('4') 0;
      border-top: 1px solid $neutral-200;
      border-bottom: 1px solid $neutral-200;
      
      :host-context(.dark-theme) & {
        border-color: $neutral-700;
      }
    }
    
    .stat {
      @include flex-column;
      align-items: center;
      gap: spacing('1');
    }
    
    .stat-value {
      @include heading-4;
      color: $primary-1000;
      
      :host-context(.dark-theme) & {
        color: $primary-300;
      }
    }
    
    .stat-label {
      @include body-xs;
      color: $neutral-600;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // QUICK LINKS
    // ========================================================================
    
    .quick-links {
      @include flex-column;
      gap: spacing('2');
      width: 100%;
    }
    
    .quick-link {
      @include flex-start;
      gap: spacing('3');
      padding: spacing('3');
      color: $neutral-800;
      text-decoration: none;
      border-radius: radius('base');
      transition: all $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
      
      &:hover {
        background-color: $neutral-50;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-800;
        }
      }
      
      mat-icon {
        color: $neutral-600;
        
        :host-context(.dark-theme) & {
          color: $neutral-400;
        }
      }
    }
    
    // ========================================================================
    // FORMS
    // ========================================================================
    
    .tab-content {
      padding: spacing('6') 0;
    }
    
    .profile-form,
    .password-form {
      @include flex-column;
      gap: spacing('5');
      max-width: 600px;
    }
    
    .form-title {
      @include heading-5;
      margin: 0 0 spacing('4') 0;
    }
    
    .form-actions {
      @include flex-start;
      gap: spacing('3');
      margin-top: spacing('2');
      
      @include mobile-only {
        flex-direction: column;
        
        app-button {
          width: 100%;
        }
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Usuario actual */
  readonly user = signal<User | null>(null);
  
  /** Estado de actualización */
  readonly isUpdating = signal(false);
  
  /** Estado de cambio de contraseña */
  readonly isChangingPassword = signal(false);
  
  /** Estadísticas */
  readonly orderCount = signal(0);
  readonly wishlistCount = signal(0);
  readonly reviewCount = signal(0);
  
  // ========================================================================
  // FORMS
  // ========================================================================
  
  /** Formulario de perfil */
  readonly profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9]{10}$/)]]
  });
  
  /** Formulario de contraseña */
  readonly passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', [Validators.required]]
  });
  
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadStats();
  }
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Cargar datos del usuario
   */
  private async loadUserData(): Promise<void> {
    try {
      // TODO: Cargar desde AuthFacade
      // const user = await this.authFacade.getCurrentUser();
      
      // Simulación
      const mockUser: User = {
        id: '123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '5512345678',
        photoURL: '',
        createdAt: new Date(),
        emailVerified: true
      };
      
      this.user.set(mockUser);
      
      // Llenar formulario
      this.profileForm.patchValue({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone
      });
      
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.toast.error('Error al cargar los datos del usuario');
    }
  }
  
  /**
   * Cargar estadísticas
   */
  private async loadStats(): Promise<void> {
    try {
      // TODO: Cargar stats reales
      this.orderCount.set(12);
      this.wishlistCount.set(8);
      this.reviewCount.set(5);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }
  
  /**
   * Actualizar perfil
   */
  async onUpdateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    
    this.isUpdating.set(true);
    
    try {
      const { name, phone } = this.profileForm.value;
      
      // TODO: Actualizar con AuthFacade
      // await this.authFacade.updateProfile({ name, phone });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.toast.saved('Perfil');
      this.profileForm.markAsPristine();
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      this.toast.error('Error al guardar los cambios');
    } finally {
      this.isUpdating.set(false);
    }
  }
  
  /**
   * Cambiar contraseña
   */
  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    
    const { newPassword, confirmNewPassword } = this.passwordForm.value;
    
    if (newPassword !== confirmNewPassword) {
      this.toast.validationError('Las contraseñas no coinciden');
      return;
    }
    
    this.isChangingPassword.set(true);
    
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      // TODO: Cambiar contraseña con AuthFacade
      // await this.authFacade.changePassword(currentPassword, newPassword);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.toast.success('Contraseña actualizada correctamente');
      this.passwordForm.reset();
      
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      this.toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      this.isChangingPassword.set(false);
    }
  }
  
  /**
   * Resetear formulario de perfil
   */
  resetProfileForm(): void {
    this.profileForm.reset({
      name: this.user()?.name,
      email: this.user()?.email,
      phone: this.user()?.phone
    });
  }
  
  /**
   * Obtener error de campo
   */
  getFieldError(fieldName: string, form: FormGroup): string {
    const control = form.get(fieldName);
    
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
    
    if (control.errors['pattern']) {
      return 'Formato inválido';
    }
    
    return 'Campo inválido';
  }
}
