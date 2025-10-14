/**
 * Catalog Facade
 * 
 * Simplifica el uso de los use cases de catálogo para la capa de presentación.
 * Expone un API simple usando Signals de Angular 20 para reactividad.
 * 
 * @pattern Facade (Gang of Four)
 * @layer Application
 */

import { Injectable, inject, signal, computed } from '@angular/core';

import { Product, isProductAvailable } from '../domain/models/product.model';
import { Category, CategoryWithChildren } from '../domain/models/category.model';
import {
  ProductFilter,
  ProductSort,
  ProductSortOption,
  ProductQueryResult,
  createProductFilter,
  createProductSort,
  hasActiveFilters,
  countActiveFilters,
} from '../domain/models/product-filter.model';

import { GetProductsUseCase } from './use-cases/get-products.use-case';
import { SearchProductsUseCase } from './use-cases/search-products.use-case';
import { GetProductDetailUseCase } from './use-cases/get-product-detail.use-case';
import { GetCategoriesUseCase } from './use-cases/get-categories.use-case';
import { CatalogDomainService } from '../domain/services/catalog.domain.service';

/**
 * Facade de catálogo
 * 
 * Proporciona una API simple y reactiva para la UI:
 * - Signals para estado reactivo
 * - Métodos asíncronos para operaciones
 * - Computed signals para datos derivados
 * - Gestión de filtros y paginación
 */
@Injectable({
  providedIn: 'root',
})
export class CatalogFacade {
  // Inyección de dependencias
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly searchProductsUseCase = inject(SearchProductsUseCase);
  private readonly getProductDetailUseCase = inject(GetProductDetailUseCase);
  private readonly getCategoriesUseCase = inject(GetCategoriesUseCase);
  private readonly domainService = inject(CatalogDomainService);

  // ==================== SIGNALS - PRODUCTS ====================

  /**
   * Productos actuales
   */
  readonly products = signal<Product[]>([]);

  /**
   * Producto seleccionado (detalle)
   */
  readonly selectedProduct = signal<Product | null>(null);

  /**
   * Productos relacionados al seleccionado
   */
  readonly relatedProducts = signal<Product[]>([]);

  /**
   * Filtros actuales
   */
  readonly currentFilter = signal<ProductFilter>(createProductFilter());

  /**
   * Ordenamiento actual
   */
  readonly currentSort = signal<ProductSort>(createProductSort());

  /**
   * Página actual
   */
  readonly currentPage = signal(1);

  /**
   * Tamaño de página
   */
  readonly pageSize = signal(20);

  /**
   * Total de items
   */
  readonly totalItems = signal(0);

  /**
   * Estado de carga
   */
  readonly isLoadingProducts = signal(false);

  /**
   * Estado de carga de detalle
   */
  readonly isLoadingDetail = signal(false);

  /**
   * Error actual
   */
  readonly error = signal<string | null>(null);

  /**
   * Query de búsqueda actual
   */
  readonly searchQuery = signal('');

  /**
   * Sugerencias de búsqueda
   */
  readonly searchSuggestions = signal<string[]>([]);

  // ==================== SIGNALS - CATEGORIES ====================

  /**
   * Todas las categorías
   */
  readonly categories = signal<Category[]>([]);

  /**
   * Árbol de categorías
   */
  readonly categoryTree = signal<CategoryWithChildren[]>([]);

  /**
   * Categoría seleccionada
   */
  readonly selectedCategory = signal<Category | null>(null);

  /**
   * Path de la categoría actual (breadcrumb)
   */
  readonly categoryPath = signal<Category[]>([]);

  /**
   * Estado de carga de categorías
   */
  readonly isLoadingCategories = signal(false);

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Total de páginas
   */
  readonly totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize())
  );

  /**
   * Tiene página siguiente
   */
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());

  /**
   * Tiene página anterior
   */
  readonly hasPreviousPage = computed(() => this.currentPage() > 1);

  /**
   * Hay filtros activos
   */
  readonly hasFilters = computed(() => hasActiveFilters(this.currentFilter()));

  /**
   * Número de filtros activos
   */
  readonly activeFiltersCount = computed(() =>
    countActiveFilters(this.currentFilter())
  );

  /**
   * Productos disponibles (con stock)
   */
  readonly availableProducts = computed(() =>
    this.products().filter(p => isProductAvailable(p))
  );

  /**
   * Productos con descuento
   */
  readonly discountedProducts = computed(() =>
    this.products().filter(p => p.hasDiscount)
  );

  /**
   * Está buscando
   */
  readonly isSearching = computed(() => this.searchQuery().length >= 2);

  /**
   * Label del ordenamiento actual
   */
  readonly sortLabel = computed(() => {
    switch (this.currentSort().option) {
      case ProductSortOption.NEWEST:
        return 'Más recientes';
      case ProductSortOption.PRICE_LOW_HIGH:
        return 'Precio: menor a mayor';
      case ProductSortOption.PRICE_HIGH_LOW:
        return 'Precio: mayor a menor';
      case ProductSortOption.MOST_SOLD:
        return 'Más vendidos';
      case ProductSortOption.BEST_RATED:
        return 'Mejor calificados';
      case ProductSortOption.ALPHABETICAL:
        return 'Alfabético A-Z';
      default:
        return 'Ordenar por';
    }
  });

  // ==================== METHODS - PRODUCTS ====================

  /**
   * Carga productos con los filtros y paginación actuales
   */
  async loadProducts(): Promise<void> {
    this.isLoadingProducts.set(true);
    this.error.set(null);

    try {
      const result = await this.getProductsUseCase.execute({
        filter: this.currentFilter(),
        sort: this.currentSort(),
        page: this.currentPage(),
        pageSize: this.pageSize(),
      });

      if (result.success && result.data) {
        this.products.set(result.data.products);
        this.totalItems.set(result.data.pagination.totalItems);
      } else {
        this.error.set(result.error || 'Error al cargar productos');
      }
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  /**
   * Busca productos por texto
   */
  async search(query: string): Promise<void> {
    this.searchQuery.set(query);

    if (query.length < 2) {
      this.searchSuggestions.set([]);
      return;
    }

    this.isLoadingProducts.set(true);
    this.error.set(null);

    try {
      const result = await this.searchProductsUseCase.execute({
        query,
        limit: 20,
      });

      if (result.success) {
        this.products.set(result.products || []);
        this.searchSuggestions.set(result.suggestions || []);
        this.totalItems.set(result.products?.length || 0);
      } else {
        this.error.set(result.error || 'Error al buscar productos');
      }
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  /**
   * Autocomplete de búsqueda
   */
  async quickSearch(query: string): Promise<void> {
    if (query.length < 2) {
      this.searchSuggestions.set([]);
      return;
    }

    const suggestions = await this.searchProductsUseCase.quickSearch(query);
    this.searchSuggestions.set(suggestions);
  }

  /**
   * Carga detalle de un producto
   */
  async loadProductDetail(productId: string, userId?: string): Promise<void> {
    this.isLoadingDetail.set(true);
    this.error.set(null);

    try {
      const result = await this.getProductDetailUseCase.execute({
        productId,
        trackView: true,
        userId,
        includeRelated: true,
      });

      if (result.success) {
        this.selectedProduct.set(result.product || null);
        this.relatedProducts.set(result.relatedProducts || []);
      } else {
        this.error.set(result.error || 'Error al cargar producto');
      }
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  /**
   * Registra un click en producto
   */
  async trackProductClick(productId: string, userId?: string): Promise<void> {
    await this.getProductDetailUseCase.trackClick(productId, userId);
  }

  // ==================== METHODS - FILTERS ====================

  /**
   * Actualiza filtros y recarga productos
   */
  async setFilter(filter: ProductFilter): Promise<void> {
    this.currentFilter.set(filter);
    this.currentPage.set(1); // Reset página
    await this.loadProducts();
  }

  /**
   * Agrega un valor a un filtro de array
   */
  async addFilterValue(
    filterType: 'brands' | 'sizes' | 'colors' | 'categoryIds' | 'tags',
    value: string
  ): Promise<void> {
    const current = this.currentFilter();
    const currentValues = current[filterType] || [];

    if (currentValues.includes(value)) return;

    this.currentFilter.set({
      ...current,
      [filterType]: [...currentValues, value],
    });

    await this.loadProducts();
  }

  /**
   * Remueve un valor de un filtro de array
   */
  async removeFilterValue(
    filterType: 'brands' | 'sizes' | 'colors' | 'categoryIds' | 'tags',
    value: string
  ): Promise<void> {
    const current = this.currentFilter();
    const currentValues = current[filterType] || [];

    this.currentFilter.set({
      ...current,
      [filterType]: currentValues.filter(v => v !== value),
    });

    await this.loadProducts();
  }

  /**
   * Limpia todos los filtros
   */
  async clearFilters(): Promise<void> {
    this.currentFilter.set(createProductFilter());
    this.currentPage.set(1);
    await this.loadProducts();
  }

  /**
   * Establece rango de precio
   */
  async setPriceRange(min: number, max: number): Promise<void> {
    this.currentFilter.set({
      ...this.currentFilter(),
      priceRange: { min, max },
    });
    await this.loadProducts();
  }

  /**
   * Establece rating mínimo
   */
  async setMinRating(rating: number): Promise<void> {
    this.currentFilter.set({
      ...this.currentFilter(),
      minRating: rating,
    });
    await this.loadProducts();
  }

  /**
   * Filtra por categoría
   */
  async filterByCategory(categoryId: string): Promise<void> {
    this.currentFilter.set({
      ...this.currentFilter(),
      categoryIds: [categoryId],
    });
    this.currentPage.set(1);
    await this.loadProducts();
  }

  // ==================== METHODS - SORTING ====================

  /**
   * Cambia el ordenamiento
   */
  async setSort(option: ProductSortOption): Promise<void> {
    this.currentSort.set(createProductSort(option));
    await this.loadProducts();
  }

  // ==================== METHODS - PAGINATION ====================

  /**
   * Va a la siguiente página
   */
  async nextPage(): Promise<void> {
    if (this.hasNextPage()) {
      this.currentPage.update(p => p + 1);
      await this.loadProducts();
    }
  }

  /**
   * Va a la página anterior
   */
  async previousPage(): Promise<void> {
    if (this.hasPreviousPage()) {
      this.currentPage.update(p => p - 1);
      await this.loadProducts();
    }
  }

  /**
   * Va a una página específica
   */
  async goToPage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      await this.loadProducts();
    }
  }

  /**
   * Infinite scroll - carga más productos
   */
  async loadMore(): Promise<void> {
    if (!this.hasNextPage() || this.isLoadingProducts()) return;

    await this.nextPage();
  }

  // ==================== METHODS - CATEGORIES ====================

  /**
   * Carga todas las categorías
   */
  async loadCategories(): Promise<void> {
    this.isLoadingCategories.set(true);

    try {
      const result = await this.getCategoriesUseCase.execute();

      if (result.success) {
        this.categories.set(result.categories || []);
      }
    } finally {
      this.isLoadingCategories.set(false);
    }
  }

  /**
   * Carga el árbol de categorías
   */
  async loadCategoryTree(): Promise<void> {
    this.isLoadingCategories.set(true);

    try {
      const result = await this.getCategoriesUseCase.getCategoryTree();

      if (result.success) {
        this.categoryTree.set(result.tree || []);
      }
    } finally {
      this.isLoadingCategories.set(false);
    }
  }

  /**
   * Carga detalle de una categoría
   */
  async loadCategoryDetail(categoryId: string): Promise<void> {
    const result = await this.getCategoriesUseCase.getCategoryDetail({
      categoryId,
      includePath: true,
      includeChildren: true,
    });

    if (result.success) {
      this.selectedCategory.set(result.category || null);
      this.categoryPath.set(result.path || []);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Formatea precio
   */
  formatPrice(price: number): string {
    return this.domainService.formatPrice(price);
  }

  /**
   * Formatea rango de precios
   */
  formatPriceRange(min: number, max: number): string {
    return this.domainService.formatPriceRange(min, max);
  }

  /**
   * Obtiene mensaje de stock
   */
  getStockMessage(product: Product, variantId?: string): string {
    return this.domainService.getStockMessage(product, variantId);
  }

  /**
   * Limpia errores
   */
  clearError(): void {
    this.error.set(null);
  }
}
