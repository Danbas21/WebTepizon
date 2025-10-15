// ============================================================================
// PRODUCT FILTERS COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Panel lateral de filtros para productos
// ============================================================================

import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';

// Components
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

/**
 * Interfaz de filtros
 */
export interface ProductFilters {
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  onSale: boolean;
}

/**
 * Interfaz de opciones de filtro
 */
export interface FilterOption {
  id: string;
  label: string;
  count: number;
}

/**
 * Componente de Filtros de Productos
 * 
 * Características:
 * - Filtro por categoría (multiple)
 * - Filtro por marca (multiple)
 * - Slider de rango de precio
 * - Filtro por rating
 * - Solo en stock
 * - En oferta
 * - Contador de filtros activos
 * - Limpiar filtros
 */
@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSliderModule,
    MatIconModule,
    ButtonComponent,
    BadgeComponent,
  ],
  template: `
    <div class="filters-container">
      <!-- Header -->
      <div class="filters-header">
        <h3 class="filters-title">Filtros</h3>
        @if (activeFiltersCount() > 0) {
          <app-badge variant="primary" size="sm">
            {{ activeFiltersCount() }}
          </app-badge>
        }
      </div>
      
      <!-- Clear filters -->
      @if (activeFiltersCount() > 0) {
        <app-button
          variant="ghost"
          size="sm"
          [fullWidth]="true"
          (clicked)="onClearFilters()">
          <span iconLeft>
            <mat-icon>clear_all</mat-icon>
          </span>
          Limpiar Filtros
        </app-button>
      }
      
      <!-- Filters panels -->
      <mat-accordion class="filters-accordion" multi>
        <!-- Categories -->
        <mat-expansion-panel [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>
              Categorías
              @if (filters().categories.length > 0) {
                <app-badge variant="primary" size="sm" class="ml-auto">
                  {{ filters().categories.length }}
                </app-badge>
              }
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="filter-options">
            @for (category of categories(); track category.id) {
              <mat-checkbox
                [checked]="filters().categories.includes(category.id)"
                (change)="onCategoryChange(category.id, $event.checked)">
                <span class="option-label">{{ category.label }}</span>
                <span class="option-count">({{ category.count }})</span>
              </mat-checkbox>
            }
          </div>
        </mat-expansion-panel>
        
        <!-- Price range -->
        <mat-expansion-panel [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>Precio</mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="filter-price">
            <div class="price-inputs">
              <div class="price-input">
                <label>Mínimo</label>
                <input 
                  type="number" 
                  [(ngModel)]="tempMinPrice"
                  (blur)="onPriceChange()"
                  [min]="0"
                  [max]="maxPriceLimit()" />
              </div>
              
              <div class="price-input">
                <label>Máximo</label>
                <input 
                  type="number" 
                  [(ngModel)]="tempMaxPrice"
                  (blur)="onPriceChange()"
                  [min]="0"
                  [max]="maxPriceLimit()" />
              </div>
            </div>
            
            <mat-slider 
              class="price-slider"
              [min]="0" 
              [max]="maxPriceLimit()"
              [step]="100">
              <input 
                matSliderStartThumb 
                [(ngModel)]="tempMinPrice"
                (ngModelChange)="onPriceSliderChange()" />
              <input 
                matSliderEndThumb 
                [(ngModel)]="tempMaxPrice"
                (ngModelChange)="onPriceSliderChange()" />
            </mat-slider>
          </div>
        </mat-expansion-panel>
        
        <!-- Brands -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              Marcas
              @if (filters().brands.length > 0) {
                <app-badge variant="primary" size="sm" class="ml-auto">
                  {{ filters().brands.length }}
                </app-badge>
              }
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="filter-options">
            @for (brand of brands(); track brand.id) {
              <mat-checkbox
                [checked]="filters().brands.includes(brand.id)"
                (change)="onBrandChange(brand.id, $event.checked)">
                <span class="option-label">{{ brand.label }}</span>
                <span class="option-count">({{ brand.count }})</span>
              </mat-checkbox>
            }
          </div>
        </mat-expansion-panel>
        
        <!-- Rating -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Calificación</mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="filter-rating">
            @for (rating of [5, 4, 3, 2, 1]; track rating) {
              <div 
                class="rating-option"
                [class.active]="filters().minRating === rating"
                (click)="onRatingChange(rating)">
                <div class="stars">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <mat-icon [class.filled]="star <= rating">
                      {{ star <= rating ? 'star' : 'star_border' }}
                    </mat-icon>
                  }
                </div>
                <span class="rating-label">y más</span>
              </div>
            }
          </div>
        </mat-expansion-panel>
        
        <!-- Other filters -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Otros</mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="filter-options">
            <mat-checkbox
              [checked]="filters().inStockOnly"
              (change)="onInStockChange($event.checked)">
              Solo en stock
            </mat-checkbox>
            
            <mat-checkbox
              [checked]="filters().onSale"
              (change)="onSaleChange($event.checked)">
              En oferta
            </mat-checkbox>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
      
      <!-- Apply button (mobile) -->
      <div class="apply-button-mobile">
        <app-button
          variant="primary"
          [fullWidth]="true"
          (clicked)="onApplyFilters()">
          Aplicar Filtros
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // CONTAINER
    // ========================================================================
    
    .filters-container {
      @include flex-column;
      gap: spacing('4');
      height: 100%;
    }
    
    // ========================================================================
    // HEADER
    // ========================================================================
    
    .filters-header {
      @include flex-between;
      align-items: center;
      padding-bottom: spacing('4');
      border-bottom: 1px solid $neutral-200;
      
      :host-context(.dark-theme) & {
        border-color: $neutral-700;
      }
    }
    
    .filters-title {
      @include heading-5;
      margin: 0;
    }
    
    // ========================================================================
    // ACCORDION
    // ========================================================================
    
    .filters-accordion {
      @include flex-column;
      gap: spacing('2');
      
      ::ng-deep {
        .mat-expansion-panel {
          box-shadow: none !important;
          background-color: transparent !important;
          border-bottom: 1px solid $neutral-200;
          
          :host-context(.dark-theme) & {
            border-color: $neutral-700;
          }
          
          &:last-child {
            border-bottom: none;
          }
        }
        
        .mat-expansion-panel-header {
          padding: spacing('3') 0;
          height: auto;
          
          &:hover {
            background-color: transparent !important;
          }
        }
        
        .mat-expansion-panel-body {
          padding: spacing('3') 0 spacing('4') 0;
        }
        
        .mat-panel-title {
          @include body-base;
          font-weight: $font-weight-medium;
          color: $neutral-900;
          
          :host-context(.dark-theme) & {
            color: $neutral-100;
          }
        }
      }
    }
    
    .ml-auto {
      margin-left: auto;
    }
    
    // ========================================================================
    // FILTER OPTIONS
    // ========================================================================
    
    .filter-options {
      @include flex-column;
      gap: spacing('3');
      
      ::ng-deep {
        .mat-mdc-checkbox {
          width: 100%;
          
          .mdc-form-field {
            width: 100%;
          }
          
          .mdc-label {
            width: 100%;
            @include flex-between;
          }
        }
      }
    }
    
    .option-label {
      @include body-small;
      color: $neutral-800;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
    }
    
    .option-count {
      @include body-xs;
      color: $neutral-600;
      margin-left: auto;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // PRICE FILTER
    // ========================================================================
    
    .filter-price {
      @include flex-column;
      gap: spacing('4');
    }
    
    .price-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: spacing('3');
    }
    
    .price-input {
      @include flex-column;
      gap: spacing('2');
      
      label {
        @include body-xs;
        color: $neutral-600;
        
        :host-context(.dark-theme) & {
          color: $neutral-400;
        }
      }
      
      input {
        @include input-base;
        padding: spacing('2') spacing('3');
        font-size: font-size('sm');
      }
    }
    
    .price-slider {
      width: 100%;
    }
    
    // ========================================================================
    // RATING FILTER
    // ========================================================================
    
    .filter-rating {
      @include flex-column;
      gap: spacing('2');
    }
    
    .rating-option {
      @include flex-start;
      gap: spacing('2');
      align-items: center;
      padding: spacing('2') spacing('3');
      border-radius: radius('base');
      cursor: pointer;
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        background-color: $neutral-50;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-800;
        }
      }
      
      &.active {
        background-color: $primary-100;
        
        :host-context(.dark-theme) & {
          background-color: rgba($primary-500, 0.2);
        }
      }
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
    
    .rating-label {
      @include body-xs;
      color: $neutral-600;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // APPLY BUTTON (MOBILE)
    // ========================================================================
    
    .apply-button-mobile {
      display: none;
      padding-top: spacing('4');
      border-top: 1px solid $neutral-200;
      
      :host-context(.dark-theme) & {
        border-color: $neutral-700;
      }
      
      @include mobile-only {
        display: block;
      }
    }
  `]
})
export class ProductFiltersComponent {
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Filtros actuales */
  filters = input.required<ProductFilters>();
  
  /** Opciones de categorías */
  categories = input<FilterOption[]>([]);
  
  /** Opciones de marcas */
  brands = input<FilterOption[]>([]);
  
  /** Precio máximo del catálogo */
  maxPriceLimit = input<number>(10000);
  
  // ========================================================================
  // OUTPUTS
  // ========================================================================
  
  /** Evento cuando cambian los filtros */
  filtersChanged = output<ProductFilters>();
  
  /** Evento para aplicar filtros (mobile) */
  filtersApplied = output<void>();
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Precio mínimo temporal (para slider) */
  tempMinPrice = signal(0);
  
  /** Precio máximo temporal (para slider) */
  tempMaxPrice = signal(10000);
  
  /** Contador de filtros activos */
  readonly activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    
    if (f.categories.length > 0) count += f.categories.length;
    if (f.brands.length > 0) count += f.brands.length;
    if (f.minPrice > 0 || f.maxPrice < this.maxPriceLimit()) count++;
    if (f.minRating > 0) count++;
    if (f.inStockOnly) count++;
    if (f.onSale) count++;
    
    return count;
  });
  
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  
  constructor() {
    // Inicializar precios temporales con los filtros actuales
    this.tempMinPrice.set(this.filters().minPrice);
    this.tempMaxPrice.set(this.filters().maxPrice);
  }
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Cambio en categoría
   */
  onCategoryChange(categoryId: string, checked: boolean): void {
    const categories = [...this.filters().categories];
    
    if (checked) {
      categories.push(categoryId);
    } else {
      const index = categories.indexOf(categoryId);
      if (index > -1) {
        categories.splice(index, 1);
      }
    }
    
    this.emitFilters({ ...this.filters(), categories });
  }
  
  /**
   * Cambio en marca
   */
  onBrandChange(brandId: string, checked: boolean): void {
    const brands = [...this.filters().brands];
    
    if (checked) {
      brands.push(brandId);
    } else {
      const index = brands.indexOf(brandId);
      if (index > -1) {
        brands.splice(index, 1);
      }
    }
    
    this.emitFilters({ ...this.filters(), brands });
  }
  
  /**
   * Cambio en precio (input)
   */
  onPriceChange(): void {
    this.emitFilters({
      ...this.filters(),
      minPrice: this.tempMinPrice(),
      maxPrice: this.tempMaxPrice()
    });
  }
  
  /**
   * Cambio en precio (slider)
   */
  onPriceSliderChange(): void {
    // Debounce - solo emitir después de 300ms sin cambios
    setTimeout(() => {
      this.onPriceChange();
    }, 300);
  }
  
  /**
   * Cambio en rating
   */
  onRatingChange(rating: number): void {
    const minRating = this.filters().minRating === rating ? 0 : rating;
    this.emitFilters({ ...this.filters(), minRating });
  }
  
  /**
   * Cambio en "solo en stock"
   */
  onInStockChange(checked: boolean): void {
    this.emitFilters({ ...this.filters(), inStockOnly: checked });
  }
  
  /**
   * Cambio en "en oferta"
   */
  onSaleChange(checked: boolean): void {
    this.emitFilters({ ...this.filters(), onSale: checked });
  }
  
  /**
   * Limpiar todos los filtros
   */
  onClearFilters(): void {
    const clearedFilters: ProductFilters = {
      categories: [],
      brands: [],
      minPrice: 0,
      maxPrice: this.maxPriceLimit(),
      minRating: 0,
      inStockOnly: false,
      onSale: false
    };
    
    this.tempMinPrice.set(0);
    this.tempMaxPrice.set(this.maxPriceLimit());
    
    this.emitFilters(clearedFilters);
  }
  
  /**
   * Aplicar filtros (mobile)
   */
  onApplyFilters(): void {
    this.filtersApplied.emit();
  }
  
  /**
   * Emitir cambio de filtros
   */
  private emitFilters(filters: ProductFilters): void {
    this.filtersChanged.emit(filters);
  }
}
