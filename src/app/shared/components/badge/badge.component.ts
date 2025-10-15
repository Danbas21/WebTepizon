// ============================================================================
// BADGE COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Componente para mostrar badges, tags y estados
// Standalone component compatible con Angular 20
// ============================================================================

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Variantes del badge
 */
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Tamaños del badge
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Componente Badge reutilizable
 * 
 * @example
 * ```html
 * <app-badge variant="success" size="sm">
 *   Activo
 * </app-badge>
 * 
 * <app-badge variant="error" [dot]="true">
 *   5
 * </app-badge>
 * ```
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span [class]="badgeClasses()">
      <!-- Dot indicator -->
      @if (dot()) {
        <span class="badge-dot"></span>
      }
      
      <!-- Icon (opcional) -->
      @if (icon()) {
        <mat-icon class="badge-icon">{{ icon() }}</mat-icon>
      }
      
      <!-- Contenido -->
      @if (!dot()) {
        <span class="badge-content">
          <ng-content></ng-content>
        </span>
      }
      
      <!-- Close button (opcional) -->
      @if (removable()) {
        <button
          type="button"
          class="badge-close"
          (click)="handleRemove($event)"
          aria-label="Remover">
          <mat-icon>close</mat-icon>
        </button>
      }
    </span>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    :host {
      display: inline-flex;
    }
    
    // ========================================================================
    // BASE
    // ========================================================================
    
    .badge {
      @include font-inter($font-weight-medium);
      display: inline-flex;
      align-items: center;
      gap: spacing('1');
      border-radius: radius('full');
      white-space: nowrap;
      transition: all $transition-speed-fast $transition-timing;
      
      &-content {
        line-height: 1;
      }
    }
    
    // ========================================================================
    // TAMAÑOS
    // ========================================================================
    
    .badge-sm {
      padding: spacing('1') spacing('2');
      font-size: font-size('xs');
      
      &.badge-dot {
        padding: 0;
        width: 8px;
        height: 8px;
      }
      
      .badge-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
      
      .badge-close mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }
    
    .badge-md {
      padding: spacing('1') spacing('3');
      font-size: font-size('sm');
      
      &.badge-dot {
        padding: 0;
        width: 10px;
        height: 10px;
      }
      
      .badge-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      
      .badge-close mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    
    .badge-lg {
      padding: spacing('2') spacing('4');
      font-size: font-size('base');
      
      &.badge-dot {
        padding: 0;
        width: 12px;
        height: 12px;
      }
      
      .badge-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      
      .badge-close mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    // ========================================================================
    // VARIANTES - COLORES
    // ========================================================================
    
    .badge-primary {
      background-color: $primary-100;
      color: $primary-1000;
      
      :host-context(.dark-theme) & {
        background-color: rgba($primary-500, 0.2);
        color: $primary-300;
      }
    }
    
    .badge-secondary {
      background-color: $secondary-100;
      color: $secondary-1000;
      
      :host-context(.dark-theme) & {
        background-color: rgba($secondary-500, 0.2);
        color: $secondary-300;
      }
    }
    
    .badge-success {
      background-color: $success-lighter;
      color: $success-dark;
      
      :host-context(.dark-theme) & {
        background-color: rgba($success, 0.2);
        color: $success-light;
      }
    }
    
    .badge-warning {
      background-color: $warning-lighter;
      color: $warning-dark;
      
      :host-context(.dark-theme) & {
        background-color: rgba($warning, 0.2);
        color: $warning-light;
      }
    }
    
    .badge-error {
      background-color: $error-lighter;
      color: $error-dark;
      
      :host-context(.dark-theme) & {
        background-color: rgba($error, 0.2);
        color: $error-light;
      }
    }
    
    .badge-info {
      background-color: $info-lighter;
      color: $info-dark;
      
      :host-context(.dark-theme) & {
        background-color: rgba($info, 0.2);
        color: $info-light;
      }
    }
    
    .badge-neutral {
      background-color: $neutral-200;
      color: $neutral-800;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-700;
        color: $neutral-200;
      }
    }
    
    // ========================================================================
    // DOT INDICATOR
    // ========================================================================
    
    .badge-dot {
      padding: 0;
      border-radius: radius('full');
      
      .badge-dot {
        display: none; // Ocultar el span interno cuando es dot
      }
    }
    
    // ========================================================================
    // OUTLINED VARIANT
    // ========================================================================
    
    .badge-outlined {
      background-color: transparent !important;
      border: $border-width solid currentColor;
      
      &.badge-primary {
        color: $primary-1000;
        border-color: $primary-500;
      }
      
      &.badge-secondary {
        color: $secondary-1000;
        border-color: $secondary-500;
      }
      
      &.badge-success {
        color: $success-dark;
        border-color: $success;
      }
      
      &.badge-warning {
        color: $warning-dark;
        border-color: $warning;
      }
      
      &.badge-error {
        color: $error-dark;
        border-color: $error;
      }
      
      &.badge-info {
        color: $info-dark;
        border-color: $info;
      }
      
      &.badge-neutral {
        color: $neutral-700;
        border-color: $neutral-400;
      }
    }
    
    // ========================================================================
    // PILL (más redondeado)
    // ========================================================================
    
    .badge-pill {
      border-radius: radius('full');
      padding-left: spacing('3');
      padding-right: spacing('3');
    }
    
    // ========================================================================
    // ICONO
    // ========================================================================
    
    .badge-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    // ========================================================================
    // REMOVABLE
    // ========================================================================
    
    .badge-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-left: spacing('1');
      border-radius: radius('full');
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        opacity: 0.7;
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      mat-icon {
        display: flex;
      }
    }
    
    // ========================================================================
    // PULSING (para notificaciones)
    // ========================================================================
    
    .badge-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    // ========================================================================
    // CLICKABLE
    // ========================================================================
    
    .badge-clickable {
      cursor: pointer;
      
      &:hover {
        opacity: 0.8;
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class BadgeComponent {
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Variante del badge */
  variant = input<BadgeVariant>('primary');
  
  /** Tamaño del badge */
  size = input<BadgeSize>('md');
  
  /** Mostrar solo como punto (dot indicator) */
  dot = input<boolean>(false);
  
  /** Icono a mostrar */
  icon = input<string>('');
  
  /** Permite remover el badge */
  removable = input<boolean>(false);
  
  /** Estilo outlined (borde) */
  outlined = input<boolean>(false);
  
  /** Estilo pill (más redondeado) */
  pill = input<boolean>(false);
  
  /** Animación pulsante */
  pulse = input<boolean>(false);
  
  /** Es clickeable */
  clickable = input<boolean>(false);
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Clases CSS del badge
   */
  badgeClasses = computed(() => {
    const classes = ['badge'];
    
    // Variante
    classes.push(`badge-${this.variant()}`);
    
    // Tamaño
    classes.push(`badge-${this.size()}`);
    
    // Modificadores
    if (this.dot()) {
      classes.push('badge-dot');
    }
    
    if (this.outlined()) {
      classes.push('badge-outlined');
    }
    
    if (this.pill()) {
      classes.push('badge-pill');
    }
    
    if (this.pulse()) {
      classes.push('badge-pulse');
    }
    
    if (this.clickable()) {
      classes.push('badge-clickable');
    }
    
    return classes.join(' ');
  });
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar remoción del badge
   */
  handleRemove(event: Event): void {
    event.stopPropagation();
    console.log('Badge removed');
    // El componente padre debe manejar la remoción real
  }
}
