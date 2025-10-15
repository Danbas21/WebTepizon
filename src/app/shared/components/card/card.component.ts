// ============================================================================
// CARD COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Componente de tarjeta reutilizable para mostrar contenido estructurado
// Standalone component compatible con Angular 20
// ============================================================================

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Variantes del card
 */
export type CardVariant = 'elevated' | 'outlined' | 'flat';

/**
 * Componente Card reutilizable
 * 
 * @example
 * ```html
 * <app-card variant="elevated" [clickable]="true">
 *   <div cardHeader>
 *     <h3>Título</h3>
 *   </div>
 *   <div cardContent>
 *     <p>Contenido de la tarjeta</p>
 *   </div>
 *   <div cardFooter>
 *     <app-button>Acción</app-button>
 *   </div>
 * </app-card>
 * ```
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses()">
      <!-- Header (opcional) -->
      @if (hasHeader) {
        <div class="card-header">
          <ng-content select="[cardHeader]"></ng-content>
        </div>
      }
      
      <!-- Cover image (opcional) -->
      @if (hasCover) {
        <div class="card-cover">
          <ng-content select="[cardCover]"></ng-content>
        </div>
      }
      
      <!-- Contenido principal -->
      <div class="card-content">
        <ng-content></ng-content>
        <ng-content select="[cardContent]"></ng-content>
      </div>
      
      <!-- Footer (opcional) -->
      @if (hasFooter) {
        <div class="card-footer">
          <ng-content select="[cardFooter]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    :host {
      display: block;
    }
    
    // ========================================================================
    // ESTILOS BASE
    // ========================================================================
    
    .card {
      background-color: $neutral-0;
      border-radius: radius('lg');
      overflow: hidden;
      transition: all $transition-speed-base $transition-timing;
      
      // Dark mode
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
    }
    
    // ========================================================================
    // VARIANTES
    // ========================================================================
    
    // Elevated - Con sombra (por defecto)
    .card-elevated {
      box-shadow: shadow('base');
      
      &:hover {
        box-shadow: shadow('lg');
        transform: translateY(-2px);
      }
      
      &.card-clickable {
        cursor: pointer;
        
        &:active {
          transform: translateY(0);
        }
      }
    }
    
    // Outlined - Con borde
    .card-outlined {
      border: $border-width solid $neutral-300;
      box-shadow: none;
      
      &:hover {
        border-color: $primary-500;
      }
      
      &.card-clickable {
        cursor: pointer;
        
        &:hover {
          box-shadow: shadow('sm');
        }
      }
      
      :host-context(.dark-theme) & {
        border-color: $neutral-700;
      }
    }
    
    // Flat - Sin sombra ni borde
    .card-flat {
      box-shadow: none;
      
      &.card-clickable {
        cursor: pointer;
        
        &:hover {
          background-color: $neutral-50;
        }
      }
      
      :host-context(.dark-theme) &.card-clickable:hover {
        background-color: $neutral-700;
      }
    }
    
    // ========================================================================
    // SECCIONES DEL CARD
    // ========================================================================
    
    // Header
    .card-header {
      padding: spacing('6');
      padding-bottom: spacing('4');
      border-bottom: $border-width solid $neutral-200;
      
      :host-context(.dark-theme) & {
        border-bottom-color: $neutral-700;
      }
      
      ::ng-deep h1,
      ::ng-deep h2,
      ::ng-deep h3,
      ::ng-deep h4,
      ::ng-deep h5,
      ::ng-deep h6 {
        margin: 0;
      }
    }
    
    // Cover image
    .card-cover {
      width: 100%;
      overflow: hidden;
      
      ::ng-deep img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
        transition: transform $transition-speed-base $transition-timing;
      }
      
      .card-clickable:hover & ::ng-deep img {
        transform: scale(1.05);
      }
    }
    
    // Content
    .card-content {
      padding: spacing('6');
    }
    
    // Footer
    .card-footer {
      padding: spacing('4') spacing('6');
      padding-top: 0;
      
      @include flex-between;
      gap: spacing('4');
      
      ::ng-deep .button-group {
        display: flex;
        gap: spacing('2');
        flex-wrap: wrap;
      }
    }
    
    // ========================================================================
    // MODIFICADORES
    // ========================================================================
    
    // Padding reducido
    .card-compact {
      .card-header,
      .card-content {
        padding: spacing('4');
      }
      
      .card-footer {
        padding: spacing('3') spacing('4');
        padding-top: 0;
      }
    }
    
    // Sin padding
    .card-no-padding {
      .card-content {
        padding: 0;
      }
    }
    
    // ========================================================================
    // RESPONSIVE
    // ========================================================================
    
    @include mobile-only {
      .card {
        border-radius: radius('base');
      }
      
      .card-header,
      .card-content {
        padding: spacing('4');
      }
      
      .card-footer {
        padding: spacing('3') spacing('4');
        padding-top: 0;
        flex-direction: column;
        align-items: stretch;
        
        ::ng-deep .button-group {
          width: 100%;
          
          app-button {
            flex: 1;
          }
        }
      }
    }
  `]
})
export class CardComponent {
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Variante del card */
  variant = input<CardVariant>('elevated');
  
  /** El card es clickeable */
  clickable = input<boolean>(false);
  
  /** Padding reducido */
  compact = input<boolean>(false);
  
  /** Sin padding en el contenido */
  noPadding = input<boolean>(false);
  
  // ========================================================================
  // PROPIEDADES
  // ========================================================================
  
  /** Indica si tiene header */
  hasHeader = false;
  
  /** Indica si tiene footer */
  hasFooter = false;
  
  /** Indica si tiene cover */
  hasCover = false;
  
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  
  ngAfterContentInit(): void {
    // Detectar si hay contenido proyectado en los slots
    // Esto se hace mediante @ContentChild en versiones anteriores
    // En Angular 20 con signals, lo simplificamos verificando en el template
  }
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Clases CSS del card basadas en props
   */
  cardClasses = computed(() => {
    const classes = ['card'];
    
    // Variante
    classes.push(`card-${this.variant()}`);
    
    // Clickable
    if (this.clickable()) {
      classes.push('card-clickable');
    }
    
    // Compact
    if (this.compact()) {
      classes.push('card-compact');
    }
    
    // No padding
    if (this.noPadding()) {
      classes.push('card-no-padding');
    }
    
    return classes.join(' ');
  });
}
