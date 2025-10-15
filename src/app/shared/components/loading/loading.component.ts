// ============================================================================
// LOADING COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Componente para indicar estados de carga
// Standalone component compatible con Angular 20
// ============================================================================

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tipos de spinner
 */
export type SpinnerType = 'spinner' | 'dots' | 'pulse' | 'bars';

/**
 * Tamaños del spinner
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Variantes de color
 */
export type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'current';

/**
 * Componente Loading reutilizable
 * 
 * @example
 * ```html
 * <app-loading type="spinner" size="md" variant="primary"></app-loading>
 * 
 * <app-loading type="dots" [fullscreen]="true" [overlay]="true">
 *   Cargando...
 * </app-loading>
 * ```
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (fullscreen()) {
      <!-- Fullscreen loading -->
      <div class="loading-fullscreen">
        @if (overlay()) {
          <div class="loading-overlay"></div>
        }
        
        <div class="loading-content">
          <div [class]="spinnerClasses()">
            @switch (type()) {
              @case ('spinner') {
                <div class="spinner-circle"></div>
              }
              @case ('dots') {
                <div class="spinner-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              }
              @case ('pulse') {
                <div class="spinner-pulse"></div>
              }
              @case ('bars') {
                <div class="spinner-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              }
            }
          </div>
          
          @if (text()) {
            <p class="loading-text">{{ text() }}</p>
          } @else {
            <p class="loading-text">
              <ng-content></ng-content>
            </p>
          }
        </div>
      </div>
    } @else {
      <!-- Inline loading -->
      <div [class]="containerClasses()">
        <div [class]="spinnerClasses()">
          @switch (type()) {
            @case ('spinner') {
              <div class="spinner-circle"></div>
            }
            @case ('dots') {
              <div class="spinner-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            }
            @case ('pulse') {
              <div class="spinner-pulse"></div>
            }
            @case ('bars') {
              <div class="spinner-bars">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            }
          }
        </div>
        
        @if (text()) {
          <span class="loading-text-inline">{{ text() }}</span>
        } @else if (hasContent) {
          <span class="loading-text-inline">
            <ng-content></ng-content>
          </span>
        }
      </div>
    }
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // CONTAINER
    // ========================================================================
    
    .loading-container {
      display: inline-flex;
      align-items: center;
      gap: spacing('2');
    }
    
    .loading-container-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: spacing('3');
      padding: spacing('6');
    }
    
    // ========================================================================
    // FULLSCREEN
    // ========================================================================
    
    .loading-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: z('modal');
      @include flex-column-center;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba($neutral-900, 0.5);
      backdrop-filter: blur(4px);
      
      :host-context(.dark-theme) & {
        background-color: rgba($neutral-1000, 0.7);
      }
    }
    
    .loading-content {
      position: relative;
      z-index: 1;
      @include flex-column-center;
      gap: spacing('4');
      background-color: $neutral-0;
      padding: spacing('8');
      border-radius: radius('xl');
      box-shadow: shadow('2xl');
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
    }
    
    // ========================================================================
    // SPINNER BASE
    // ========================================================================
    
    .spinner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    // ========================================================================
    // TAMAÑOS
    // ========================================================================
    
    .spinner-xs {
      width: 16px;
      height: 16px;
    }
    
    .spinner-sm {
      width: 24px;
      height: 24px;
    }
    
    .spinner-md {
      width: 32px;
      height: 32px;
    }
    
    .spinner-lg {
      width: 48px;
      height: 48px;
    }
    
    .spinner-xl {
      width: 64px;
      height: 64px;
    }
    
    // ========================================================================
    // VARIANTES DE COLOR
    // ========================================================================
    
    .spinner-primary {
      color: $primary-1000;
      
      :host-context(.dark-theme) & {
        color: $primary-500;
      }
    }
    
    .spinner-secondary {
      color: $secondary-1000;
      
      :host-context(.dark-theme) & {
        color: $secondary-500;
      }
    }
    
    .spinner-white {
      color: $neutral-0;
    }
    
    .spinner-current {
      color: currentColor;
    }
    
    // ========================================================================
    // TIPO: SPINNER (círculo giratorio)
    // ========================================================================
    
    .spinner-circle {
      width: 100%;
      height: 100%;
      border: 3px solid currentColor;
      border-top-color: transparent;
      border-radius: radius('full');
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    // ========================================================================
    // TIPO: DOTS (puntos saltando)
    // ========================================================================
    
    .spinner-dots {
      display: flex;
      gap: spacing('1');
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      
      span {
        width: 25%;
        height: 25%;
        background-color: currentColor;
        border-radius: radius('full');
        animation: bounce 1.4s infinite ease-in-out both;
        
        &:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }
    
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    // ========================================================================
    // TIPO: PULSE (pulsante)
    // ========================================================================
    
    .spinner-pulse {
      width: 100%;
      height: 100%;
      background-color: currentColor;
      border-radius: radius('full');
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(0.8);
      }
    }
    
    // ========================================================================
    // TIPO: BARS (barras)
    // ========================================================================
    
    .spinner-bars {
      display: flex;
      gap: spacing('1');
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      
      span {
        width: 15%;
        height: 100%;
        background-color: currentColor;
        border-radius: radius('sm');
        animation: bars 1.2s infinite ease-in-out both;
        
        &:nth-child(1) {
          animation-delay: -0.4s;
        }
        
        &:nth-child(2) {
          animation-delay: -0.3s;
        }
        
        &:nth-child(3) {
          animation-delay: -0.2s;
        }
        
        &:nth-child(4) {
          animation-delay: -0.1s;
        }
      }
    }
    
    @keyframes bars {
      0%, 40%, 100% {
        transform: scaleY(0.4);
        opacity: 0.5;
      }
      20% {
        transform: scaleY(1);
        opacity: 1;
      }
    }
    
    // ========================================================================
    // TEXTO
    // ========================================================================
    
    .loading-text {
      @include body-base;
      color: $neutral-800;
      text-align: center;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
    }
    
    .loading-text-inline {
      @include body-small;
      color: $neutral-700;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
    }
    
    // ========================================================================
    // RESPONSIVE
    // ========================================================================
    
    @include mobile-only {
      .loading-content {
        padding: spacing('6');
        margin: spacing('4');
      }
    }
  `]
})
export class LoadingComponent {
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Tipo de spinner */
  type = input<SpinnerType>('spinner');
  
  /** Tamaño del spinner */
  size = input<SpinnerSize>('md');
  
  /** Variante de color */
  variant = input<SpinnerVariant>('primary');
  
  /** Texto a mostrar */
  text = input<string>('');
  
  /** Mostrar en fullscreen */
  fullscreen = input<boolean>(false);
  
  /** Mostrar overlay (solo con fullscreen) */
  overlay = input<boolean>(true);
  
  /** Layout en bloque (vertical) */
  block = input<boolean>(false);
  
  // ========================================================================
  // PROPIEDADES
  // ========================================================================
  
  /** Indica si hay contenido proyectado */
  hasContent = false;
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Clases del container
   */
  containerClasses = computed(() => {
    const classes = ['loading-container'];
    
    if (this.block()) {
      classes.push('loading-container-block');
    }
    
    return classes.join(' ');
  });
  
  /**
   * Clases del spinner
   */
  spinnerClasses = computed(() => {
    const classes = ['spinner'];
    
    // Tamaño
    classes.push(`spinner-${this.size()}`);
    
    // Variante
    classes.push(`spinner-${this.variant()}`);
    
    return classes.join(' ');
  });
}
