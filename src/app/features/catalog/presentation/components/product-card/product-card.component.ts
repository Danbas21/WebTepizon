// ============================================================================
// PRODUCT CARD COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Tarjeta de producto reutilizable para grids y listas
// ============================================================================

import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

// Services
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Interfaz simplificada de producto para el card
 */
export interface ProductCardData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isFavorite?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

/**
 * Componente ProductCard
 * 
 * Características:
 * - Imagen con hover effect
 * - Precio y descuento
 * - Rating con estrellas
 * - Badges (nuevo, descuento, agotado)
 * - Botones de acción (wishlist, quick view)
 * - Botón agregar al carrito
 * - Responsive
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    ButtonComponent,
    BadgeComponent,
  ],
  template: `
    <div class="product-card" [class.out-of-stock]="!product().inStock">
      <!-- Image container -->
      <div class="product-image-container">
        <a [routerLink]="['/products', product().id]" class="image-link">
          <!-- Main image -->
          <img 
            [src]="currentImage()" 
            [alt]="product().name"
            class="product-image"
            loading="lazy" />
          
          <!-- Hover image (segunda imagen si existe) -->
          @if (product().images.length > 1) {
            <img 
              [src]="product().images[1]" 
              [alt]="product().name"
              class="product-image-hover"
              loading="lazy" />
          }
        </a>
        
        <!-- Badges -->
        <div class="badges">
          @if (product().isNew) {
            <app-badge variant="info" size="sm">Nuevo</app-badge>
          }
          @if (product().discount && product().discount > 0) {
            <app-badge variant="error" size="sm">
              -{{ product().discount }}%
            </app-badge>
          }
          @if (!product().inStock) {
            <app-badge variant="neutral" size="sm">Agotado</app-badge>
          }
        </div>
        
        <!-- Actions overlay -->
        <div class="actions-overlay">
          <!-- Wishlist button -->
          <button
            type="button"
            class="action-button"
            [class.active]="product().isFavorite"
            (click)="onToggleFavorite($event)"
            [matTooltip]="product().isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            matTooltipPosition="left">
            <mat-icon>
              {{ product().isFavorite ? 'favorite' : 'favorite_border' }}
            </mat-icon>
          </button>
          
          <!-- Quick view button -->
          <button
            type="button"
            class="action-button"
            (click)="onQuickView($event)"
            matTooltip="Vista rápida"
            matTooltipPosition="left">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>
        
        <!-- Add to cart button (appears on hover) -->
        @if (product().inStock) {
          <div class="add-to-cart-overlay">
            <app-button
              variant="primary"
              size="sm"
              [fullWidth]="true"
              [loading]="isAddingToCart()"
              (clicked)="onAddToCart($event)">
              <span iconLeft>
                <mat-icon>shopping_cart</mat-icon>
              </span>
              Agregar al Carrito
            </app-button>
          </div>
        }
      </div>
      
      <!-- Content -->
      <div class="product-content">
        <!-- Category -->
        <a 
          [routerLink]="['/categories', categorySlug()]" 
          class="product-category">
          {{ product().category }}
        </a>
        
        <!-- Name -->
        <a 
          [routerLink]="['/products', product().id]" 
          class="product-name">
          {{ product().name }}
        </a>
        
        <!-- Rating -->
        <div class="product-rating">
          <div class="stars">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <mat-icon [class.filled]="star <= product().rating">
                {{ star <= product().rating ? 'star' : 'star_border' }}
              </mat-icon>
            }
          </div>
          <span class="rating-count">({{ product().reviewCount }})</span>
        </div>
        
        <!-- Price -->
        <div class="product-price">
          <span class="current-price">
            {{ product().price | currency:'MXN':'symbol-narrow':'1.0-0' }}
          </span>
          
          @if (product().originalPrice && product().originalPrice > product().price) {
            <span class="original-price">
              {{ product().originalPrice | currency:'MXN':'symbol-narrow':'1.0-0' }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // CARD CONTAINER
    // ========================================================================
    
    .product-card {
      @include flex-column;
      background-color: $neutral-0;
      border-radius: radius('lg');
      overflow: hidden;
      transition: all $transition-speed-base $transition-timing;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
      
      &:hover {
        box-shadow: shadow('lg');
        transform: translateY(-4px);
      }
      
      &.out-of-stock {
        opacity: 0.7;
        
        .product-image-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba($neutral-0, 0.5);
        }
      }
    }
    
    // ========================================================================
    // IMAGE CONTAINER
    // ========================================================================
    
    .product-image-container {
      position: relative;
      width: 100%;
      padding-top: 100%; // 1:1 aspect ratio
      overflow: hidden;
      background-color: $neutral-100;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-900;
      }
    }
    
    .image-link {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity $transition-speed-base $transition-timing;
    }
    
    .product-image-hover {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity $transition-speed-base $transition-timing;
      
      .product-card:hover & {
        opacity: 1;
      }
    }
    
    // ========================================================================
    // BADGES
    // ========================================================================
    
    .badges {
      position: absolute;
      top: spacing('3');
      left: spacing('3');
      @include flex-column;
      gap: spacing('2');
      z-index: 2;
    }
    
    // ========================================================================
    // ACTIONS OVERLAY
    // ========================================================================
    
    .actions-overlay {
      position: absolute;
      top: spacing('3');
      right: spacing('3');
      @include flex-column;
      gap: spacing('2');
      opacity: 0;
      transform: translateX(10px);
      transition: all $transition-speed-base $transition-timing;
      z-index: 2;
      
      .product-card:hover & {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .action-button {
      @include flex-center;
      width: 40px;
      height: 40px;
      background-color: $neutral-0;
      border: none;
      border-radius: radius('full');
      cursor: pointer;
      transition: all $transition-speed-fast $transition-timing;
      box-shadow: shadow('sm');
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: $neutral-700;
        transition: color $transition-speed-fast $transition-timing;
        
        :host-context(.dark-theme) & {
          color: $neutral-300;
        }
      }
      
      &:hover {
        background-color: $primary-1000;
        transform: scale(1.1);
        
        mat-icon {
          color: $neutral-0;
        }
      }
      
      &.active {
        background-color: $error;
        
        mat-icon {
          color: $neutral-0;
        }
      }
    }
    
    // ========================================================================
    // ADD TO CART OVERLAY
    // ========================================================================
    
    .add-to-cart-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: spacing('3');
      background: linear-gradient(to top, rgba($neutral-1000, 0.8), transparent);
      opacity: 0;
      transform: translateY(10px);
      transition: all $transition-speed-base $transition-timing;
      z-index: 2;
      
      .product-card:hover & {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    // ========================================================================
    // CONTENT
    // ========================================================================
    
    .product-content {
      @include flex-column;
      gap: spacing('2');
      padding: spacing('4');
    }
    
    .product-category {
      @include body-xs;
      color: $neutral-600;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: color $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
      
      &:hover {
        color: $primary-1000;
        
        :host-context(.dark-theme) & {
          color: $primary-300;
        }
      }
    }
    
    .product-name {
      @include body-base;
      font-weight: $font-weight-medium;
      color: $neutral-900;
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        color: $neutral-100;
      }
      
      &:hover {
        color: $primary-1000;
        
        :host-context(.dark-theme) & {
          color: $primary-300;
        }
      }
    }
    
    // ========================================================================
    // RATING
    // ========================================================================
    
    .product-rating {
      @include flex-start;
      gap: spacing('2');
      align-items: center;
    }
    
    .stars {
      @include flex-start;
      gap: spacing('0.5');
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $neutral-300;
        
        &.filled {
          color: $warning;
        }
      }
    }
    
    .rating-count {
      @include body-xs;
      color: $neutral-600;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // PRICE
    // ========================================================================
    
    .product-price {
      @include flex-start;
      gap: spacing('2');
      align-items: baseline;
    }
    
    .current-price {
      @include heading-5;
      color: $primary-1000;
      font-weight: $font-weight-bold;
      
      :host-context(.dark-theme) & {
        color: $primary-300;
      }
    }
    
    .original-price {
      @include body-small;
      color: $neutral-500;
      text-decoration: line-through;
    }
  `]
})
export class ProductCardComponent {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly toast = inject(ToastService);
  
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Datos del producto */
  product = input.required<ProductCardData>();
  
  // ========================================================================
  // OUTPUTS
  // ========================================================================
  
  /** Evento cuando se agrega al carrito */
  addedToCart = output<string>();
  
  /** Evento cuando se togglea favorito */
  toggledFavorite = output<string>();
  
  /** Evento cuando se solicita quick view */
  quickView = output<string>();
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Estado de agregar al carrito */
  readonly isAddingToCart = signal(false);
  
  /** Imagen actual (por defecto la primera) */
  readonly currentImage = computed(() => this.product().images[0] || '/assets/images/placeholder.jpg');
  
  /** Slug de la categoría */
  readonly categorySlug = computed(() => 
    this.product().category.toLowerCase().replace(/\s+/g, '-')
  );
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Agregar producto al carrito
   */
  async onAddToCart(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    this.isAddingToCart.set(true);
    
    try {
      // TODO: Llamar al CartService
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.addedToCart.emit(this.product().id);
      this.toast.addedToCart(this.product().name);
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      this.toast.error('Error al agregar al carrito');
    } finally {
      this.isAddingToCart.set(false);
    }
  }
  
  /**
   * Toggle favorito
   */
  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.toggledFavorite.emit(this.product().id);
    
    if (this.product().isFavorite) {
      this.toast.removedFromWishlist(this.product().name);
    } else {
      this.toast.addedToWishlist(this.product().name);
    }
  }
  
  /**
   * Mostrar quick view
   */
  onQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.quickView.emit(this.product().id);
  }
}
