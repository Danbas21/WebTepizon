// ============================================================================
// HEADER COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Header principal de la aplicación con navegación, búsqueda y acciones
// Compatible con Angular 20 y SSR
// ============================================================================

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ButtonComponent } from '../button/button.component';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Interfaz para items del menú de navegación
 */
interface NavItem {
  label: string;
  route: string;
  icon?: string;
  badge?: number;
}

/**
 * Componente Header principal
 * 
 * Características:
 * - Navegación responsive
 * - Búsqueda de productos
 * - Carrito con badge
 * - Switch de tema (light/dark)
 * - Menú de usuario
 * - Mobile menu
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    ButtonComponent,
  ],
  template: `
    <header class="header">
      <mat-toolbar class="toolbar">
        <div class="container toolbar-content">
          <!-- Mobile menu button -->
          <button 
            mat-icon-button 
            class="mobile-menu-btn"
            (click)="toggleMobileMenu()"
            aria-label="Abrir menú">
            <mat-icon>menu</mat-icon>
          </button>
          
          <!-- Logo -->
          <a routerLink="/" class="logo">
            <span class="logo-text">TEPIZON</span>
          </a>
          
          <!-- Search bar (desktop) -->
          <div class="search-bar desktop-only">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="search"
              placeholder="Buscar productos..."
              class="search-input"
              [(ngModel)]="searchQuery"
              (keyup.enter)="handleSearch()"
              aria-label="Buscar productos" />
          </div>
          
          <!-- Actions -->
          <div class="actions">
            <!-- Theme toggle -->
            <button 
              mat-icon-button
              (click)="toggleTheme()"
              [attr.aria-label]="isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              class="theme-toggle">
              <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            
            <!-- Wishlist -->
            <button 
              mat-icon-button
              routerLink="/wishlist"
              aria-label="Lista de deseos"
              class="action-btn">
              <mat-icon [matBadge]="wishlistCount()" matBadgeColor="warn">
                favorite_border
              </mat-icon>
            </button>
            
            <!-- Cart -->
            <button 
              mat-icon-button
              routerLink="/cart"
              aria-label="Carrito de compras"
              class="action-btn cart-btn">
              <mat-icon [matBadge]="cartCount()" matBadgeColor="accent">
                shopping_cart
              </mat-icon>
            </button>
            
            <!-- User menu -->
            @if (isAuthenticated()) {
              <button 
                mat-icon-button
                [matMenuTriggerFor]="userMenu"
                aria-label="Menú de usuario"
                class="user-btn">
                <mat-icon>account_circle</mat-icon>
              </button>
            } @else {
              <app-button
                variant="primary"
                size="sm"
                routerLink="/auth/login">
                Ingresar
              </app-button>
            }
          </div>
        </div>
      </mat-toolbar>
      
      <!-- Navigation (desktop) -->
      <nav class="navigation desktop-only">
        <div class="container">
          <ul class="nav-list">
            @for (item of navItems; track item.route) {
              <li class="nav-item">
                <a 
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  class="nav-link">
                  {{ item.label }}
                  @if (item.badge) {
                    <span class="nav-badge">{{ item.badge }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      </nav>
      
      <!-- Mobile navigation -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu">
          <!-- Search bar (mobile) -->
          <div class="search-bar mobile-search">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="search"
              placeholder="Buscar productos..."
              class="search-input"
              [(ngModel)]="searchQuery"
              (keyup.enter)="handleSearch(); closeMobileMenu()"
              aria-label="Buscar productos" />
          </div>
          
          <!-- Nav items -->
          <ul class="mobile-nav-list">
            @for (item of navItems; track item.route) {
              <li>
                <a 
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  class="mobile-nav-link"
                  (click)="closeMobileMenu()">
                  @if (item.icon) {
                    <mat-icon>{{ item.icon }}</mat-icon>
                  }
                  {{ item.label }}
                  @if (item.badge) {
                    <span class="nav-badge">{{ item.badge }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </header>
    
    <!-- User menu dropdown -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <button mat-menu-item routerLink="/profile">
        <mat-icon>person</mat-icon>
        <span>Mi Perfil</span>
      </button>
      <button mat-menu-item routerLink="/orders">
        <mat-icon>receipt_long</mat-icon>
        <span>Mis Órdenes</span>
      </button>
      <button mat-menu-item routerLink="/wishlist">
        <mat-icon>favorite</mat-icon>
        <span>Lista de Deseos</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item routerLink="/settings">
        <mat-icon>settings</mat-icon>
        <span>Configuración</span>
      </button>
      <button mat-menu-item (click)="handleLogout()">
        <mat-icon>logout</mat-icon>
        <span>Cerrar Sesión</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // HEADER PRINCIPAL
    // ========================================================================
    
    .header {
      position: sticky;
      top: 0;
      z-index: z('sticky');
      box-shadow: shadow('sm');
      background-color: $neutral-0;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-900;
      }
    }
    
    .toolbar {
      padding: 0;
      min-height: 64px;
      
      &-content {
        @include flex-between;
        width: 100%;
        gap: spacing('4');
      }
    }
    
    // ========================================================================
    // LOGO
    // ========================================================================
    
    .logo {
      @include flex-center;
      text-decoration: none;
      color: $primary-1000;
      transition: opacity $transition-speed-fast $transition-timing;
      
      &:hover {
        opacity: 0.8;
      }
      
      &-text {
        @include heading-5;
        font-weight: $font-weight-bold;
        letter-spacing: 0.05em;
      }
    }
    
    // ========================================================================
    // BARRA DE BÚSQUEDA
    // ========================================================================
    
    .search-bar {
      @include flex-start;
      position: relative;
      flex: 1;
      max-width: 600px;
      
      .search-icon {
        position: absolute;
        left: spacing('3');
        color: $neutral-500;
        pointer-events: none;
      }
      
      .search-input {
        @include input-base;
        padding-left: spacing('10');
        
        &:focus {
          border-color: $primary-500;
        }
      }
    }
    
    // ========================================================================
    // ACCIONES
    // ========================================================================
    
    .actions {
      @include flex-end;
      gap: spacing('2');
    }
    
    .action-btn,
    .theme-toggle,
    .user-btn {
      color: $neutral-800;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
      
      &:hover {
        background-color: rgba($primary-500, 0.1);
      }
    }
    
    .cart-btn {
      ::ng-deep .mat-badge-content {
        background-color: $secondary-1000;
      }
    }
    
    // ========================================================================
    // NAVEGACIÓN DESKTOP
    // ========================================================================
    
    .navigation {
      background-color: $primary-1000;
      padding: spacing('2') 0;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
    }
    
    .nav-list {
      @include flex-start;
      gap: spacing('6');
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .nav-item {
      position: relative;
    }
    
    .nav-link {
      @include font-inter($font-weight-medium);
      @include flex-center;
      gap: spacing('2');
      padding: spacing('2') spacing('3');
      color: $neutral-0;
      text-decoration: none;
      font-size: font-size('sm');
      border-radius: radius('base');
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        background-color: rgba($neutral-0, 0.1);
        text-decoration: none;
      }
      
      &.active {
        background-color: rgba($neutral-0, 0.15);
        font-weight: $font-weight-semibold;
      }
    }
    
    .nav-badge {
      @include badge('primary');
      background-color: $secondary-1000;
      color: $neutral-0;
    }
    
    // ========================================================================
    // MOBILE MENU
    // ========================================================================
    
    .mobile-menu-btn {
      @include desktop-up {
        display: none !important;
      }
    }
    
    .mobile-menu {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: $neutral-0;
      z-index: z('fixed');
      overflow-y: auto;
      padding: spacing('4');
      @include slide-up;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-900;
      }
    }
    
    .mobile-search {
      margin-bottom: spacing('4');
    }
    
    .mobile-nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      
      li {
        margin-bottom: spacing('2');
      }
    }
    
    .mobile-nav-link {
      @include flex-start;
      gap: spacing('3');
      padding: spacing('4');
      color: $neutral-900;
      text-decoration: none;
      border-radius: radius('base');
      font-weight: $font-weight-medium;
      transition: all $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        color: $neutral-0;
      }
      
      &:hover {
        background-color: $neutral-50;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-800;
        }
      }
      
      &.active {
        background-color: $primary-100;
        color: $primary-1000;
        
        :host-context(.dark-theme) & {
          background-color: rgba($primary-500, 0.2);
          color: $primary-300;
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
    // RESPONSIVE
    // ========================================================================
    
    @include mobile-only {
      .desktop-only {
        display: none !important;
      }
      
      .logo-text {
        font-size: font-size('lg');
      }
      
      .actions {
        gap: spacing('1');
        
        app-button {
          font-size: font-size('xs');
          padding: spacing('2') spacing('3');
        }
      }
    }
    
    @include desktop-up {
      .mobile-menu-btn {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  // ========================================================================
  // SERVICES
  // ========================================================================
  
  private readonly themeService = inject(ThemeService);
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Estado del menú móvil */
  readonly mobileMenuOpen = signal(false);
  
  /** Query de búsqueda */
  searchQuery = '';
  
  /** Cantidad de items en el carrito */
  readonly cartCount = signal(0);
  
  /** Cantidad de items en wishlist */
  readonly wishlistCount = signal(0);
  
  /** Estado de autenticación */
  readonly isAuthenticated = signal(false);
  
  /** Modo oscuro activo */
  readonly isDarkMode = this.themeService.isDarkMode;
  
  // ========================================================================
  // DATOS
  // ========================================================================
  
  /** Items de navegación */
  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/', icon: 'home' },
    { label: 'Productos', route: '/products', icon: 'shopping_bag' },
    { label: 'Categorías', route: '/categories', icon: 'category' },
    { label: 'Ofertas', route: '/deals', icon: 'local_offer', badge: 5 },
    { label: 'Contacto', route: '/contact', icon: 'contact_support' },
  ];
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Alternar tema claro/oscuro
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  /**
   * Abrir/cerrar menú móvil
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }
  
  /**
   * Cerrar menú móvil
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  
  /**
   * Manejar búsqueda
   */
  handleSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Buscando:', this.searchQuery);
      // TODO: Navegar a página de resultados
      // this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
  
  /**
   * Cerrar sesión
   */
  handleLogout(): void {
    console.log('Cerrando sesión...');
    // TODO: Implementar logout
    this.isAuthenticated.set(false);
  }
}
