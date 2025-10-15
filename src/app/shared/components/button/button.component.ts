// ============================================================================
// BUTTON COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Componente de botón reutilizable con múltiples variantes y tamaños
// Standalone component compatible con Angular 20
// ============================================================================

import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tipos de variantes del botón
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Tamaños disponibles
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Componente Button reutilizable
 * 
 * @example
 * ```html
 * <app-button 
 *   variant="primary" 
 *   size="md"
 *   (clicked)="handleClick()">
 *   Click me
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [class]="buttonClasses()"
      [disabled]="disabled() || loading()"
      (click)="handleClick()">
      
      <!-- Loading spinner -->
      @if (loading()) {
        <span class="button-spinner"></span>
      }
      
      <!-- Icon izquierdo -->
      @if (iconLeft() && !loading()) {
        <span class="button-icon button-icon-left">
          <ng-content select="[iconLeft]"></ng-content>
        </span>
      }
      
      <!-- Contenido principal -->
      <span class="button-content">
        <ng-content></ng-content>
      </span>
      
      <!-- Icon derecho -->
      @if (iconRight() && !loading()) {
        <span class="button-icon button-icon-right">
          <ng-content select="[iconRight]"></ng-content>
        </span>
      }
    </button>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    :host {
      display: inline-block;
    }
    
    // Estilos base del botón
    button {
      @include button-base;
      position: relative;
      
      // Desactivar estilos del navegador
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    
    // ========================================================================
    // VARIANTES
    // ========================================================================
    
    // Primary - Botón principal de acción
    .button-primary {
      background-color: $primary-1000;
      color: $neutral-0;
      border: none;
      
      &:hover:not(:disabled) {
        background-color: $primary-800;
        transform: translateY(-1px);
        box-shadow: shadow('md');
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
        background-color: $primary-900;
      }
    }
    
    // Secondary - Botón secundario con borde
    .button-secondary {
      background-color: $neutral-0;
      color: $primary-1000;
      border: $border-width solid $neutral-300;
      
      &:hover:not(:disabled) {
        background-color: $neutral-50;
        border-color: $primary-1000;
      }
      
      &:active:not(:disabled) {
        background-color: $neutral-100;
      }
    }
    
    // Ghost - Botón transparente
    .button-ghost {
      background-color: transparent;
      color: $primary-1000;
      border: none;
      
      &:hover:not(:disabled) {
        background-color: $neutral-50;
      }
      
      &:active:not(:disabled) {
        background-color: $neutral-100;
      }
    }
    
    // Danger - Botón de acción destructiva
    .button-danger {
      background-color: $error;
      color: $neutral-0;
      border: none;
      
      &:hover:not(:disabled) {
        background-color: $error-dark;
        transform: translateY(-1px);
        box-shadow: shadow('md');
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }
    
    // ========================================================================
    // TAMAÑOS
    // ========================================================================
    
    .button-sm {
      @include button-size('sm');
    }
    
    .button-md {
      @include button-size('md');
    }
    
    .button-lg {
      @include button-size('lg');
    }
    
    // ========================================================================
    // FULL WIDTH
    // ========================================================================
    
    .button-full {
      width: 100%;
    }
    
    // ========================================================================
    // ESTADOS
    // ========================================================================
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    
    // ========================================================================
    // LOADING
    // ========================================================================
    
    .button-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: radius('full');
      animation: spin 0.6s linear infinite;
      margin-right: spacing('2');
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    // ========================================================================
    // ICONOS
    // ========================================================================
    
    .button-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      
      &-left {
        margin-right: spacing('2');
      }
      
      &-right {
        margin-left: spacing('2');
      }
      
      ::ng-deep svg {
        width: 20px;
        height: 20px;
        
        .button-sm & {
          width: 16px;
          height: 16px;
        }
        
        .button-lg & {
          width: 24px;
          height: 24px;
        }
      }
    }
    
    .button-content {
      display: inline-flex;
      align-items: center;
    }
  `]
})
export class ButtonComponent {
  // ========================================================================
  // INPUTS (usando signals)
  // ========================================================================
  
  /** Variante del botón */
  variant = input<ButtonVariant>('primary');
  
  /** Tamaño del botón */
  size = input<ButtonSize>('md');
  
  /** Tipo del botón HTML */
  type = input<'button' | 'submit' | 'reset'>('button');
  
  /** Estado deshabilitado */
  disabled = input<boolean>(false);
  
  /** Estado de carga */
  loading = input<boolean>(false);
  
  /** Ancho completo */
  fullWidth = input<boolean>(false);
  
  /** Tiene icono a la izquierda */
  iconLeft = input<boolean>(false);
  
  /** Tiene icono a la derecha */
  iconRight = input<boolean>(false);
  
  // ========================================================================
  // OUTPUTS
  // ========================================================================
  
  /** Evento de click */
  clicked = output<Event>();
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Clases CSS del botón basadas en props
   */
  buttonClasses = computed(() => {
    const classes: string[] = [];
    
    // Variante
    classes.push(`button-${this.variant()}`);
    
    // Tamaño
    classes.push(`button-${this.size()}`);
    
    // Full width
    if (this.fullWidth()) {
      classes.push('button-full');
    }
    
    return classes.join(' ');
  });
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar click del botón
   */
  handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
