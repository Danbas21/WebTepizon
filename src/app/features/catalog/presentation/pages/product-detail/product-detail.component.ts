// ============================================================================
// PRODUCT DETAIL COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página de detalle de producto con galería y reviews
// ============================================================================

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { LoadingComponent } from '../../../../../shared/components/loading/loading.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ProductCardComponent, ProductCardData } from '../../components/product-card/product-card.component';

// Services
import { ToastService } from '../../../../../core/services/toast.service';

/**
 * Variante de producto (talla, color, etc.)
 */
interface ProductVariant {
  id: string;
  name: string;
  value: string;
  available: boolean;
  image?: string;
}

/**
 * Review de producto
 */
interface ProductReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: Date;
  comment: string;
  helpful: number;
}

/**
 * Producto completo
 */
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  brand: string;
  sku: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sizes?: ProductVariant[];
  colors?: ProductVariant[];
  features: string[];
  specifications: { label: string; value: string }[];
}

/**
 * Componente ProductDetail
 * 
 * Características:
 * - Galería de imágenes con thumbnails
 * - Información del producto
 * - Selector de variantes (tallas, colores)
 * - Selector de cantidad
 * - Botones de acción (carrito, wishlist, share)
 * - Tabs (descripción, especificaciones, reviews)
 * - Reviews con rating
 * - Productos relacionados
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    ButtonComponent,
    BadgeComponent,
    LoadingComponent,
    CardComponent,
    ProductCardComponent,
  ],
  template: `
    <div class="product-detail-page">
      @if (isLoading()) {
        <!-- Loading state -->
        <div class="loading-container">
          <app-loading type="spinner" size="xl" variant="primary" [block]="true">
            Cargando producto...
          </app-loading>
        </div>
      } @else if (product()) {
        <div class="container">
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <a routerLink="/">Inicio</a>
            <mat-icon>chevron_right</mat-icon>
            <a routerLink="/products">Productos</a>
            <mat-icon>chevron_right</mat-icon>
            <a [routerLink]="['/categories', categorySlug()]">{{ product()!.category }}</a>
            <mat-icon>chevron_right</mat-icon>
            <span>{{ product()!.name }}</span>
          </nav>
          
          <!-- Main content -->
          <div class="product-main">
            <!-- Gallery -->
            <div class="product-gallery">
              <!-- Main image -->
              <div class="main-image">
                <img 
                  [src]="selectedImage()" 
                  [alt]="product()!.name"
                  class="image" />
                
                <!-- Badges -->
                <div class="badges">
                  @if (product()!.discount && product()!.discount > 0) {
                    <app-badge variant="error" size="md">
                      -{{ product()!.discount }}%
                    </app-badge>
                  }
                </div>
                
                <!-- Wishlist button -->
                <button
                  type="button"
                  class="wishlist-button"
                  [class.active]="isFavorite()"
                  (click)="toggleFavorite()">
                  <mat-icon>
                    {{ isFavorite() ? 'favorite' : 'favorite_border' }}
                  </mat-icon>
                </button>
              </div>
              
              <!-- Thumbnails -->
              <div class="thumbnails">
                @for (image of product()!.images; track image; let i = $index) {
                  <button
                    type="button"
                    class="thumbnail"
                    [class.active]="selectedImageIndex() === i"
                    (click)="selectImage(i)">
                    <img [src]="image" [alt]="product()!.name" />
                  </button>
                }
              </div>
            </div>
            
            <!-- Info -->
            <div class="product-info">
              <!-- Brand -->
              <span class="brand">{{ product()!.brand }}</span>
              
              <!-- Name -->
              <h1 class="product-name">{{ product()!.name }}</h1>
              
              <!-- Rating -->
              <div class="product-rating">
                <div class="stars">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <mat-icon [class.filled]="star <= product()!.rating">
                      {{ star <= product()!.rating ? 'star' : 'star_border' }}
                    </mat-icon>
                  }
                </div>
                <span class="rating-text">
                  {{ product()!.rating }} ({{ product()!.reviewCount }} reseñas)
                </span>
              </div>
              
              <!-- Price -->
              <div class="product-price">
                <span class="current-price">
                  {{ product()!.price | currency:'MXN':'symbol-narrow':'1.0-0' }}
                </span>
                
                @if (product()!.originalPrice && product()!.originalPrice > product()!.price) {
                  <span class="original-price">
                    {{ product()!.originalPrice | currency:'MXN':'symbol-narrow':'1.0-0' }}
                  </span>
                  <app-badge variant="success" size="sm">
                    Ahorras {{ product()!.originalPrice! - product()!.price | currency:'MXN':'symbol-narrow':'1.0-0' }}
                  </app-badge>
                }
              </div>
              
              <mat-divider></mat-divider>
              
              <!-- Colors -->
              @if (product()!.colors && product()!.colors.length > 0) {
                <div class="variants-section">
                  <label class="variants-label">Color</label>
                  <div class="color-options">
                    @for (color of product()!.colors; track color.id) {
                      <button
                        type="button"
                        class="color-option"
                        [class.active]="selectedColor() === color.id"
                        [class.disabled]="!color.available"
                        [disabled]="!color.available"
                        (click)="selectColor(color.id)"
                        [style.background-color]="color.value">
                        @if (selectedColor() === color.id) {
                          <mat-icon>check</mat-icon>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
              
              <!-- Sizes -->
              @if (product()!.sizes && product()!.sizes.length > 0) {
                <div class="variants-section">
                  <label class="variants-label">Talla</label>
                  <div class="size-options">
                    @for (size of product()!.sizes; track size.id) {
                      <button
                        type="button"
                        class="size-option"
                        [class.active]="selectedSize() === size.id"
                        [class.disabled]="!size.available"
                        [disabled]="!size.available"
                        (click)="selectSize(size.id)">
                        {{ size.value }}
                      </button>
                    }
                  </div>
                </div>
              }
              
              <!-- Quantity -->
              <div class="quantity-section">
                <label class="quantity-label">Cantidad</label>
                <div class="quantity-selector">
                  <button
                    type="button"
                    class="quantity-button"
                    [disabled]="quantity() <= 1"
                    (click)="decreaseQuantity()">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <input 
                    type="number" 
                    class="quantity-input"
                    [value]="quantity()"
                    [min]="1"
                    [max]="product()!.stock"
                    (input)="onQuantityInput($event)" />
                  <button
                    type="button"
                    class="quantity-button"
                    [disabled]="quantity() >= product()!.stock"
                    (click)="increaseQuantity()">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
                <span class="stock-info">
                  @if (product()!.stock > 0) {
                    <mat-icon class="check">check_circle</mat-icon>
                    {{ product()!.stock }} disponibles
                  } @else {
                    <mat-icon class="error">cancel</mat-icon>
                    Agotado
                  }
                </span>
              </div>
              
              <!-- Actions -->
              <div class="actions">
                <app-button
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="isAddingToCart()"
                  [disabled]="!product()!.inStock"
                  (clicked)="addToCart()">
                  <span iconLeft>
                    <mat-icon>shopping_cart</mat-icon>
                  </span>
                  {{ product()!.inStock ? 'Agregar al Carrito' : 'Agotado' }}
                </app-button>
                
                <app-button
                  variant="secondary"
                  size="lg"
                  (clicked)="shareProduct()">
                  <span iconLeft>
                    <mat-icon>share</mat-icon>
                  </span>
                  Compartir
                </app-button>
              </div>
              
              <!-- SKU and Category -->
              <div class="product-meta">
                <span>SKU: {{ product()!.sku }}</span>
                <span>•</span>
                <span>Categoría: <a [routerLink]="['/categories', categorySlug()]">{{ product()!.category }}</a></span>
              </div>
            </div>
          </div>
          
          <!-- Tabs section -->
          <div class="product-tabs">
            <mat-tab-group>
              <!-- Description -->
              <mat-tab label="Descripción">
                <div class="tab-content">
                  <h3>Descripción del Producto</h3>
                  <p>{{ product()!.description }}</p>
                  
                  @if (product()!.features.length > 0) {
                    <h4>Características</h4>
                    <ul class="features-list">
                      @for (feature of product()!.features; track feature) {
                        <li>{{ feature }}</li>
                      }
                    </ul>
                  }
                </div>
              </mat-tab>
              
              <!-- Specifications -->
              <mat-tab label="Especificaciones">
                <div class="tab-content">
                  <table class="specs-table">
                    @for (spec of product()!.specifications; track spec.label) {
                      <tr>
                        <td class="spec-label">{{ spec.label }}</td>
                        <td class="spec-value">{{ spec.value }}</td>
                      </tr>
                    }
                  </table>
                </div>
              </mat-tab>
              
              <!-- Reviews -->
              <mat-tab [label]="'Reseñas (' + reviews().length + ')'">
                <div class="tab-content">
                  @if (reviews().length > 0) {
                    <div class="reviews-list">
                      @for (review of reviews(); track review.id) {
                        <div class="review-card">
                          <div class="review-header">
                            <div class="review-user">
                              @if (review.userAvatar) {
                                <img [src]="review.userAvatar" [alt]="review.userName" class="user-avatar" />
                              } @else {
                                <div class="user-avatar-placeholder">
                                  {{ review.userName.charAt(0) }}
                                </div>
                              }
                              <div class="user-info">
                                <span class="user-name">{{ review.userName }}</span>
                                <span class="review-date">{{ review.date | date:'dd/MM/yyyy' }}</span>
                              </div>
                            </div>
                            <div class="review-rating">
                              @for (star of [1, 2, 3, 4, 5]; track star) {
                                <mat-icon [class.filled]="star <= review.rating">
                                  {{ star <= review.rating ? 'star' : 'star_border' }}
                                </mat-icon>
                              }
                            </div>
                          </div>
                          <p class="review-comment">{{ review.comment }}</p>
                          <button type="button" class="helpful-button">
                            <mat-icon>thumb_up</mat-icon>
                            Útil ({{ review.helpful }})
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-reviews">
                      <mat-icon>rate_review</mat-icon>
                      <p>Aún no hay reseñas para este producto</p>
                      <app-button variant="primary">
                        Sé el primero en opinar
                      </app-button>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
          
          <!-- Related products -->
          @if (relatedProducts().length > 0) {
            <div class="related-products">
              <h2 class="section-title">Productos Relacionados</h2>
              <div class="products-grid">
                @for (product of relatedProducts(); track product.id) {
                  <app-product-card [product]="product"></app-product-card>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Not found -->
        <div class="not-found">
          <mat-icon>error_outline</mat-icon>
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe o ha sido eliminado</p>
          <app-button variant="primary" routerLink="/products">
            Ver todos los productos
          </app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    .product-detail-page {
      padding: spacing('8') 0;
      min-height: 100vh;
      
      @include mobile-only {
        padding: spacing('4') 0;
      }
    }
    
    // Similar styles as before, continuing...
    // [El archivo continúa con más de 1000 líneas de estilos]
    // Por brevedad, incluyo solo parte de los estilos clave
    
    .product-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: spacing('12');
      margin-bottom: spacing('12');
      
      @include respond-below('lg') {
        grid-template-columns: 1fr;
        gap: spacing('8');
      }
    }
    
    .product-gallery {
      @include flex-column;
      gap: spacing('4');
    }
    
    .main-image {
      position: relative;
      width: 100%;
      padding-top: 100%;
      background-color: $neutral-100;
      border-radius: radius('xl');
      overflow: hidden;
      
      .image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .thumbnails {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: spacing('2');
    }
    
    .thumbnail {
      aspect-ratio: 1;
      border: 2px solid transparent;
      border-radius: radius('base');
      overflow: hidden;
      cursor: pointer;
      transition: all $transition-speed-fast $transition-timing;
      
      &.active {
        border-color: $primary-1000;
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .product-info {
      @include flex-column;
      gap: spacing('6');
    }
    
    .product-name {
      @include heading-2;
      margin: 0;
    }
    
    .product-price {
      @include flex-start;
      gap: spacing('4');
      align-items: baseline;
    }
    
    .current-price {
      font-size: font-size('4xl');
      color: $primary-1000;
      font-weight: $font-weight-bold;
    }
    
    .quantity-selector {
      @include flex-start;
      border: 1px solid $neutral-300;
      border-radius: radius('base');
      overflow: hidden;
    }
    
    .quantity-button {
      @include flex-center;
      width: 40px;
      height: 40px;
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition: background-color $transition-speed-fast;
      
      &:hover:not(:disabled) {
        background-color: $neutral-100;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .quantity-input {
      width: 60px;
      height: 40px;
      border: none;
      border-left: 1px solid $neutral-300;
      border-right: 1px solid $neutral-300;
      text-align: center;
      font-weight: $font-weight-medium;
    }
    
    .reviews-list {
      @include flex-column;
      gap: spacing('6');
    }
    
    .review-card {
      @include flex-column;
      gap: spacing('4');
      padding: spacing('6');
      background-color: $neutral-50;
      border-radius: radius('lg');
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: spacing('6');
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  
  readonly isLoading = signal(true);
  readonly product = signal<Product | null>(null);
  readonly selectedImageIndex = signal(0);
  readonly selectedColor = signal<string>('');
  readonly selectedSize = signal<string>('');
  readonly quantity = signal(1);
  readonly isFavorite = signal(false);
  readonly isAddingToCart = signal(false);
  readonly reviews = signal<ProductReview[]>([]);
  readonly relatedProducts = signal<ProductCardData[]>([]);
  
  readonly selectedImage = computed(() => 
    this.product()?.images[this.selectedImageIndex()] || ''
  );
  
  readonly categorySlug = computed(() =>
    this.product()?.category.toLowerCase().replace(/\s+/g, '-') || ''
  );
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }
  
  async loadProduct(id: string): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // TODO: Llamar al ProductService
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockProduct: Product = {
        id,
        name: 'Producto Ejemplo',
        description: 'Descripción detallada del producto...',
        price: 1299,
        originalPrice: 1899,
        discount: 32,
        images: Array.from({ length: 5 }, (_, i) => `/assets/images/product-${i + 1}.jpg`),
        category: 'Ropa',
        brand: 'Nike',
        sku: 'PRD-123456',
        rating: 4.5,
        reviewCount: 127,
        inStock: true,
        stock: 15,
        sizes: [
          { id: 'xs', name: 'Extra Small', value: 'XS', available: true },
          { id: 's', name: 'Small', value: 'S', available: true },
          { id: 'm', name: 'Medium', value: 'M', available: true },
          { id: 'l', name: 'Large', value: 'L', available: false },
          { id: 'xl', name: 'Extra Large', value: 'XL', available: true },
        ],
        colors: [
          { id: 'black', name: 'Negro', value: '#000000', available: true },
          { id: 'white', name: 'Blanco', value: '#FFFFFF', available: true },
          { id: 'blue', name: 'Azul', value: '#0000FF', available: true },
        ],
        features: [
          'Material de alta calidad',
          'Diseño ergonómico',
          'Fácil de limpiar',
          'Garantía de 1 año'
        ],
        specifications: [
          { label: 'Material', value: '100% Algodón' },
          { label: 'Peso', value: '250g' },
          { label: 'Dimensiones', value: '30x40x10 cm' },
          { label: 'País de origen', value: 'México' },
        ]
      };
      
      this.product.set(mockProduct);
      this.loadRelatedProducts();
      this.loadReviews();
      
    } catch (error) {
      console.error('Error al cargar producto:', error);
      this.toast.error('Error al cargar el producto');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async loadRelatedProducts(): Promise<void> {
    // TODO: Cargar productos relacionados
    const mockProducts: ProductCardData[] = Array.from({ length: 4 }, (_, i) => ({
      id: `related-${i}`,
      name: `Producto Relacionado ${i + 1}`,
      description: 'Descripción',
      price: Math.random() * 1000 + 100,
      images: [`/assets/images/product-${i + 1}.jpg`],
      category: 'Ropa',
      rating: 4,
      reviewCount: 50,
      inStock: true,
    }));
    
    this.relatedProducts.set(mockProducts);
  }
  
  async loadReviews(): Promise<void> {
    // TODO: Cargar reviews reales
    const mockReviews: ProductReview[] = Array.from({ length: 3 }, (_, i) => ({
      id: `review-${i}`,
      userName: `Usuario ${i + 1}`,
      rating: Math.floor(Math.random() * 2) + 4,
      date: new Date(),
      comment: 'Excelente producto, muy recomendado!',
      helpful: Math.floor(Math.random() * 20)
    }));
    
    this.reviews.set(mockReviews);
  }
  
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }
  
  selectColor(colorId: string): void {
    this.selectedColor.set(colorId);
  }
  
  selectSize(sizeId: string): void {
    this.selectedSize.set(sizeId);
  }
  
  increaseQuantity(): void {
    const max = this.product()?.stock || 1;
    if (this.quantity() < max) {
      this.quantity.update(q => q + 1);
    }
  }
  
  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }
  
  onQuantityInput(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    const max = this.product()?.stock || 1;
    
    if (value >= 1 && value <= max) {
      this.quantity.set(value);
    }
  }
  
  async addToCart(): Promise<void> {
    this.isAddingToCart.set(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      this.toast.addedToCart(this.product()!.name);
    } catch (error) {
      this.toast.error('Error al agregar al carrito');
    } finally {
      this.isAddingToCart.set(false);
    }
  }
  
  toggleFavorite(): void {
    this.isFavorite.update(fav => !fav);
    
    if (this.isFavorite()) {
      this.toast.addedToWishlist(this.product()!.name);
    } else {
      this.toast.removedFromWishlist(this.product()!.name);
    }
  }
  
  shareProduct(): void {
    // TODO: Implementar share con Web Share API
    if (navigator.share) {
      navigator.share({
        title: this.product()!.name,
        text: this.product()!.description,
        url: window.location.href
      });
    } else {
      this.toast.info('Copiado al portapapeles');
    }
  }
}
