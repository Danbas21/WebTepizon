// ============================================================================
// PRODUCT LIST COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página de listado de productos con filtros y ordenamiento
// ============================================================================

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';

// Components
import { ProductCardComponent, ProductCardData } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent, ProductFilters, FilterOption } from '../../components/product-filters/product-filters.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { LoadingComponent } from '../../../../../shared/components/loading/loading.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

/**
 * Opciones de ordenamiento
 */
type SortOption = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'name';

/**
 * Tipo de vista
 */
type ViewType = 'grid' | 'list';

/**
 * Componente de Lista de Productos
 * 
 * Características:
 * - Grid responsive de productos
 * - Filtros laterales (sidebar)
 * - Ordenamiento
 * - Vista grid/lista
 * - Paginación
 * - Loading states
 * - Empty state
 * - Mobile responsive con drawer
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatSidenavModule,
    ProductCardComponent,
    ProductFiltersComponent,
    ButtonComponent,
    LoadingComponent,
    BadgeComponent,
  ],
  template: `
    <div class="product-list-page">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a href="/">Inicio</a>
          <mat-icon>chevron_right</mat-icon>
          <span>Productos</span>
        </nav>
        
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <h1 class="page-title">Todos los Productos</h1>
            <p class="result-count">{{ totalProducts() }} productos encontrados</p>
          </div>
          
          <!-- Mobile filter button -->
          <app-button
            variant="secondary"
            size="md"
            class="mobile-filter-button"
            (clicked)="drawer.toggle()">
            <span iconLeft>
              <mat-icon>filter_list</mat-icon>
            </span>
            Filtros
            @if (activeFiltersCount() > 0) {
              <app-badge variant="primary" size="sm" class="ml-2">
                {{ activeFiltersCount() }}
              </app-badge>
            }
          </app-button>
        </div>
        
        <!-- Main content with drawer -->
        <mat-drawer-container class="content-container">
          <!-- Filters sidebar/drawer -->
          <mat-drawer
            #drawer
            [mode]="drawerMode()"
            [opened]="drawerOpened()"
            class="filters-drawer">
            <app-product-filters
              [filters]="filters()"
              [categories]="categoryOptions()"
              [brands]="brandOptions()"
              [maxPriceLimit]="10000"
              (filtersChanged)="onFiltersChange($event)"
              (filtersApplied)="drawer.close()">
            </app-product-filters>
          </mat-drawer>
          
          <!-- Products content -->
          <mat-drawer-content class="products-content">
            <!-- Toolbar -->
            <div class="products-toolbar">
              <div class="toolbar-left">
                <span class="toolbar-label">Mostrando {{ displayedProductsCount() }} de {{ totalProducts() }}</span>
              </div>
              
              <div class="toolbar-right">
                <!-- Sort -->
                <mat-select 
                  [(value)]="sortBy"
                  (selectionChange)="onSortChange()"
                  class="sort-select">
                  <mat-option value="popular">Más Popular</mat-option>
                  <mat-option value="newest">Más Reciente</mat-option>
                  <mat-option value="price-asc">Precio: Menor a Mayor</mat-option>
                  <mat-option value="price-desc">Precio: Mayor a Menor</mat-option>
                  <mat-option value="name">Nombre: A-Z</mat-option>
                </mat-select>
                
                <!-- View toggle -->
                <mat-button-toggle-group 
                  [(value)]="viewType"
                  (change)="onViewChange()"
                  class="view-toggle">
                  <mat-button-toggle value="grid">
                    <mat-icon>grid_view</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle value="list">
                    <mat-icon>view_list</mat-icon>
                  </mat-button-toggle>
                </mat-button-toggle-group>
              </div>
            </div>
            
            <!-- Loading state -->
            @if (isLoading()) {
              <div class="loading-container">
                <app-loading type="spinner" size="lg" variant="primary" [block]="true">
                  Cargando productos...
                </app-loading>
              </div>
            }
            
            <!-- Empty state -->
            @else if (products().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros o buscar algo diferente</p>
                <app-button variant="primary" (clicked)="onClearFilters()">
                  Limpiar Filtros
                </app-button>
              </div>
            }
            
            <!-- Products grid/list -->
            @else {
              <div [class]="viewType() === 'grid' ? 'products-grid' : 'products-list'">
                @for (product of paginatedProducts(); track product.id) {
                  <app-product-card
                    [product]="product"
                    (addedToCart)="onAddedToCart($event)"
                    (toggledFavorite)="onToggledFavorite($event)"
                    (quickView)="onQuickView($event)">
                  </app-product-card>
                }
              </div>
              
              <!-- Pagination -->
              <div class="pagination">
                <app-button
                  variant="secondary"
                  [disabled]="currentPage() === 1"
                  (clicked)="previousPage()">
                  <span iconLeft>
                    <mat-icon>chevron_left</mat-icon>
                  </span>
                  Anterior
                </app-button>
                
                <div class="page-numbers">
                  @for (page of pageNumbers(); track page) {
                    <button
                      class="page-number"
                      [class.active]="page === currentPage()"
                      (click)="goToPage(page)">
                      {{ page }}
                    </button>
                  }
                </div>
                
                <app-button
                  variant="secondary"
                  [disabled]="currentPage() === totalPages()"
                  (clicked)="nextPage()">
                  Siguiente
                  <span iconRight>
                    <mat-icon>chevron_right</mat-icon>
                  </span>
                </app-button>
              </div>
            }
          </mat-drawer-content>
        </mat-drawer-container>
      </div>
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // PAGE LAYOUT
    // ========================================================================
    
    .product-list-page {
      padding: spacing('8') 0;
      min-height: 100vh;
      
      @include mobile-only {
        padding: spacing('4') 0;
      }
    }
    
    // ========================================================================
    // BREADCRUMB
    // ========================================================================
    
    .breadcrumb {
      @include flex-start;
      gap: spacing('2');
      align-items: center;
      margin-bottom: spacing('6');
      
      a {
        @include body-small;
        color: $neutral-600;
        text-decoration: none;
        
        &:hover {
          color: $primary-1000;
        }
      }
      
      span {
        @include body-small;
        color: $neutral-900;
        font-weight: $font-weight-medium;
        
        :host-context(.dark-theme) & {
          color: $neutral-100;
        }
      }
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // PAGE HEADER
    // ========================================================================
    
    .page-header {
      @include flex-between;
      align-items: flex-start;
      margin-bottom: spacing('8');
      
      @include mobile-only {
        margin-bottom: spacing('6');
      }
    }
    
    .header-left {
      @include flex-column;
      gap: spacing('2');
    }
    
    .page-title {
      @include heading-2;
      margin: 0;
      
      @include mobile-only {
        font-size: font-size('3xl');
      }
    }
    
    .result-count {
      @include body-base;
      color: $neutral-600;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    .mobile-filter-button {
      display: none;
      
      @include tablet-down {
        display: flex;
      }
    }
    
    .ml-2 {
      margin-left: spacing('2');
    }
    
    // ========================================================================
    // DRAWER CONTAINER
    // ========================================================================
    
    .content-container {
      min-height: 600px;
      
      ::ng-deep {
        .mat-drawer {
          width: 280px;
          padding: spacing('6');
          border-right: 1px solid $neutral-200;
          background-color: $neutral-0;
          
          :host-context(.dark-theme) & {
            border-color: $neutral-700;
            background-color: $neutral-900;
          }
          
          @include tablet-down {
            width: 100%;
            max-width: 320px;
          }
        }
        
        .mat-drawer-content {
          overflow: visible;
        }
      }
    }
    
    // ========================================================================
    // PRODUCTS CONTENT
    // ========================================================================
    
    .products-content {
      @include flex-column;
      gap: spacing('6');
    }
    
    // ========================================================================
    // TOOLBAR
    // ========================================================================
    
    .products-toolbar {
      @include flex-between;
      align-items: center;
      padding: spacing('4');
      background-color: $neutral-50;
      border-radius: radius('lg');
      
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
      }
      
      @include mobile-only {
        flex-direction: column;
        gap: spacing('3');
        align-items: flex-start;
      }
    }
    
    .toolbar-left {
      @include flex-start;
      gap: spacing('4');
    }
    
    .toolbar-label {
      @include body-small;
      color: $neutral-700;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
    }
    
    .toolbar-right {
      @include flex-start;
      gap: spacing('3');
      
      @include mobile-only {
        width: 100%;
        justify-content: space-between;
      }
    }
    
    .sort-select {
      min-width: 200px;
      
      @include mobile-only {
        flex: 1;
        min-width: auto;
      }
    }
    
    .view-toggle {
      @include mobile-only {
        display: none;
      }
    }
    
    // ========================================================================
    // PRODUCTS GRID
    // ========================================================================
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: spacing('6');
      
      @include respond-below('lg') {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: spacing('4');
      }
      
      @include mobile-only {
        grid-template-columns: repeat(2, 1fr);
        gap: spacing('3');
      }
    }
    
    // ========================================================================
    // PRODUCTS LIST
    // ========================================================================
    
    .products-list {
      @include flex-column;
      gap: spacing('4');
    }
    
    // ========================================================================
    // LOADING
    // ========================================================================
    
    .loading-container {
      @include flex-center;
      min-height: 400px;
    }
    
    // ========================================================================
    // EMPTY STATE
    // ========================================================================
    
    .empty-state {
      @include flex-column-center;
      gap: spacing('4');
      padding: spacing('16') spacing('8');
      text-align: center;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: $neutral-400;
      }
      
      h3 {
        @include heading-4;
        color: $neutral-800;
        margin: 0;
        
        :host-context(.dark-theme) & {
          color: $neutral-200;
        }
      }
      
      p {
        @include body-base;
        color: $neutral-600;
        margin: 0;
        max-width: 400px;
        
        :host-context(.dark-theme) & {
          color: $neutral-400;
        }
      }
    }
    
    // ========================================================================
    // PAGINATION
    // ========================================================================
    
    .pagination {
      @include flex-between;
      align-items: center;
      padding-top: spacing('8');
      
      @include mobile-only {
        flex-direction: column;
        gap: spacing('4');
      }
    }
    
    .page-numbers {
      @include flex-center;
      gap: spacing('2');
    }
    
    .page-number {
      @include flex-center;
      min-width: 40px;
      height: 40px;
      padding: 0 spacing('3');
      background-color: transparent;
      border: 1px solid $neutral-300;
      border-radius: radius('base');
      color: $neutral-700;
      cursor: pointer;
      transition: all $transition-speed-fast $transition-timing;
      
      :host-context(.dark-theme) & {
        border-color: $neutral-700;
        color: $neutral-300;
      }
      
      &:hover {
        background-color: $neutral-50;
        border-color: $primary-1000;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-800;
        }
      }
      
      &.active {
        background-color: $primary-1000;
        border-color: $primary-1000;
        color: $neutral-0;
        
        :host-context(.dark-theme) & {
          background-color: $primary-500;
        }
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  
  // ========================================================================
  // SIGNALS - ESTADO
  // ========================================================================
  
  /** Estado de carga */
  readonly isLoading = signal(true);
  
  /** Productos */
  readonly products = signal<ProductCardData[]>([]);
  
  /** Total de productos */
  readonly totalProducts = signal(0);
  
  /** Filtros actuales */
  readonly filters = signal<ProductFilters>({
    categories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    inStockOnly: false,
    onSale: false
  });
  
  /** Tipo de ordenamiento */
  sortBy = signal<SortOption>('popular');
  
  /** Tipo de vista */
  viewType = signal<ViewType>('grid');
  
  /** Página actual */
  readonly currentPage = signal(1);
  
  /** Items por página */
  readonly itemsPerPage = signal(12);
  
  /** Drawer abierto (desktop siempre abierto) */
  readonly drawerOpened = signal(true);
  
  // ========================================================================
  // SIGNALS - OPCIONES
  // ========================================================================
  
  /** Opciones de categorías */
  readonly categoryOptions = signal<FilterOption[]>([
    { id: 'ropa', label: 'Ropa', count: 234 },
    { id: 'deportes', label: 'Deportes', count: 156 },
    { id: 'hogar', label: 'Hogar', count: 189 },
    { id: 'decoracion', label: 'Decoración', count: 142 },
    { id: 'tecnologia', label: 'Tecnología', count: 98 },
  ]);
  
  /** Opciones de marcas */
  readonly brandOptions = signal<FilterOption[]>([
    { id: 'nike', label: 'Nike', count: 45 },
    { id: 'adidas', label: 'Adidas', count: 38 },
    { id: 'puma', label: 'Puma', count: 27 },
    { id: 'reebok', label: 'Reebok', count: 19 },
    { id: 'converse', label: 'Converse', count: 15 },
  ]);
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /** Modo del drawer (side en desktop, over en mobile) */
  readonly drawerMode = computed<MatDrawerMode>(() => {
    // TODO: Usar un servicio de breakpoints
    return window.innerWidth >= 992 ? 'side' : 'over';
  });
  
  /** Contador de filtros activos */
  readonly activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    
    if (f.categories.length > 0) count += f.categories.length;
    if (f.brands.length > 0) count += f.brands.length;
    if (f.minPrice > 0 || f.maxPrice < 10000) count++;
    if (f.minRating > 0) count++;
    if (f.inStockOnly) count++;
    if (f.onSale) count++;
    
    return count;
  });
  
  /** Productos paginados */
  readonly paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.products().slice(start, end);
  });
  
  /** Total de páginas */
  readonly totalPages = computed(() => 
    Math.ceil(this.products().length / this.itemsPerPage())
  );
  
  /** Números de página a mostrar */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const numbers: number[] = [];
    
    // Mostrar máximo 5 números
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    // Ajustar si estamos cerca del final
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    
    return numbers;
  });
  
  /** Cantidad de productos mostrados */
  readonly displayedProductsCount = computed(() => 
    Math.min(this.currentPage() * this.itemsPerPage(), this.totalProducts())
  );
  
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  
  ngOnInit(): void {
    this.loadProducts();
    
    // Escuchar cambios en query params (para filtros desde URL)
    this.route.queryParams.subscribe(params => {
      // TODO: Aplicar filtros desde URL
    });
  }
  
  // ========================================================================
  // MÉTODOS - DATA
  // ========================================================================
  
  /**
   * Cargar productos
   */
  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // TODO: Llamar al ProductService con filtros
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockProducts: ProductCardData[] = Array.from({ length: 48 }, (_, i) => ({
        id: `product-${i + 1}`,
        name: `Producto ${i + 1}`,
        description: 'Descripción del producto',
        price: Math.floor(Math.random() * 2000) + 100,
        originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 3000) + 200 : undefined,
        discount: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : undefined,
        images: [
          `/assets/images/products/product-${(i % 10) + 1}.jpg`,
          `/assets/images/products/product-${(i % 10) + 1}-2.jpg`
        ],
        category: ['Ropa', 'Deportes', 'Hogar', 'Decoración'][Math.floor(Math.random() * 4)],
        rating: Math.floor(Math.random() * 2) + 3,
        reviewCount: Math.floor(Math.random() * 100) + 5,
        inStock: Math.random() > 0.1,
        isFavorite: Math.random() > 0.7,
        isNew: Math.random() > 0.8,
        isFeatured: Math.random() > 0.9
      }));
      
      this.products.set(mockProducts);
      this.totalProducts.set(mockProducts.length);
      
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // ========================================================================
  // MÉTODOS - FILTROS
  // ========================================================================
  
  /**
   * Cambio en filtros
   */
  onFiltersChange(newFilters: ProductFilters): void {
    this.filters.set(newFilters);
    this.currentPage.set(1); // Reset a primera página
    this.loadProducts();
  }
  
  /**
   * Limpiar filtros
   */
  onClearFilters(): void {
    this.filters.set({
      categories: [],
      brands: [],
      minPrice: 0,
      maxPrice: 10000,
      minRating: 0,
      inStockOnly: false,
      onSale: false
    });
    this.loadProducts();
  }
  
  // ========================================================================
  // MÉTODOS - ORDENAMIENTO
  // ========================================================================
  
  /**
   * Cambio en ordenamiento
   */
  onSortChange(): void {
    this.currentPage.set(1); // Reset a primera página
    this.loadProducts();
  }
  
  // ========================================================================
  // MÉTODOS - VISTA
  // ========================================================================
  
  /**
   * Cambio en tipo de vista
   */
  onViewChange(): void {
    // Solo cambiar la vista, no recargar datos
  }
  
  // ========================================================================
  // MÉTODOS - PAGINACIÓN
  // ========================================================================
  
  /**
   * Ir a página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  /**
   * Ir a página siguiente
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  /**
   * Ir a página específica
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // ========================================================================
  // MÉTODOS - ACCIONES DE PRODUCTO
  // ========================================================================
  
  /**
   * Producto agregado al carrito
   */
  onAddedToCart(productId: string): void {
    console.log('Producto agregado al carrito:', productId);
    // TODO: Actualizar contador del carrito
  }
  
  /**
   * Toggle favorito
   */
  onToggledFavorite(productId: string): void {
    console.log('Favorito toggled:', productId);
    // TODO: Actualizar estado en el backend
    
    // Actualizar localmente
    this.products.update(products =>
      products.map(p =>
        p.id === productId
          ? { ...p, isFavorite: !p.isFavorite }
          : p
      )
    );
  }
  
  /**
   * Quick view
   */
  onQuickView(productId: string): void {
    console.log('Quick view:', productId);
    // TODO: Abrir modal con detalle rápido
  }
}
