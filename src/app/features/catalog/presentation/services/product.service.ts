// ============================================================================
// PRODUCT SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio para gestión de productos con Signals y Firebase
// ============================================================================

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Models
import { ProductCardData } from '../../presentation/components/product-card/product-card.component';
import { ProductFilters } from '../../presentation/components/product-filters/product-filters.component';

/**
 * Producto completo (modelo de dominio)
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  
  // Categorización
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  tags: string[];
  
  // Stock e inventario
  sku: string;
  barcode?: string;
  inStock: boolean;
  stock: number;
  lowStockThreshold: number;
  
  // Variantes
  hasVariants: boolean;
  sizes?: ProductVariant[];
  colors?: ProductVariant[];
  variants?: ProductVariant[];
  
  // Rating y reviews
  rating: number;
  reviewCount: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Características
  features: string[];
  specifications: ProductSpecification[];
  
  // Flags
  isNew: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  
  // Fechas
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Dimensiones y peso (para envío)
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
}

/**
 * Variante de producto
 */
export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier?: number;
  sku?: string;
  stock?: number;
  available: boolean;
  image?: string;
  colorHex?: string;
}

/**
 * Especificación de producto
 */
export interface ProductSpecification {
  label: string;
  value: string;
  group?: string;
}

/**
 * Parámetros de búsqueda/filtrado
 */
export interface ProductSearchParams {
  query?: string;
  categoryId?: string;
  brandId?: string;
  filters?: ProductFilters;
  sortBy?: 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'name' | 'rating';
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de productos
 */
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Servicio de Productos
 * 
 * Características:
 * - Gestión completa de productos (CRUD)
 * - Búsqueda y filtrado avanzado
 * - Caché en memoria con Signals
 * - Integración con Firebase/Backend
 * - Manejo de favoritos
 * - Productos relacionados
 * - Productos vistos recientemente
 * 
 * @example
 * ```typescript
 * constructor(private productService: ProductService) {
 *   effect(() => {
 *     console.log('Productos:', this.productService.products());
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly http = inject(HttpClient);
  
  // Base URL del API
  private readonly API_URL = '/api/products'; // TODO: Mover a environment
  
  // ========================================================================
  // SIGNALS - CACHÉ
  // ========================================================================
  
  /**
   * Caché de productos
   * Mapa de productId -> Product
   */
  private readonly productsCache = signal<Map<string, Product>>(new Map());
  
  /**
   * Productos en el listado actual
   */
  private readonly currentProducts = signal<Product[]>([]);
  
  /**
   * Total de productos en la búsqueda actual
   */
  private readonly totalProducts = signal(0);
  
  /**
   * Estado de carga
   */
  private readonly isLoadingSignal = signal(false);
  
  /**
   * Últimos parámetros de búsqueda
   */
  private readonly lastSearchParams = signal<ProductSearchParams | null>(null);
  
  /**
   * Productos vistos recientemente (IDs)
   */
  private readonly recentlyViewedIds = signal<string[]>([]);
  
  /**
   * Productos favoritos (IDs)
   */
  private readonly favoriteIds = signal<string[]>([]);
  
  // ========================================================================
  // SIGNALS PÚBLICOS (READONLY)
  // ========================================================================
  
  /** Productos actuales (readonly) */
  readonly products = this.currentProducts.asReadonly();
  
  /** Total de productos (readonly) */
  readonly total = this.totalProducts.asReadonly();
  
  /** Estado de carga (readonly) */
  readonly isLoading = this.isLoadingSignal.asReadonly();
  
  /** IDs de favoritos (readonly) */
  readonly favorites = this.favoriteIds.asReadonly();
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Productos vistos recientemente (completos)
   */
  readonly recentlyViewed = computed(() => {
    const ids = this.recentlyViewedIds();
    const cache = this.productsCache();
    return ids
      .map(id => cache.get(id))
      .filter(p => p !== undefined) as Product[];
  });
  
  /**
   * Productos favoritos (completos)
   */
  readonly favoriteProducts = computed(() => {
    const ids = this.favoriteIds();
    const cache = this.productsCache();
    return ids
      .map(id => cache.get(id))
      .filter(p => p !== undefined) as Product[];
  });
  
  /**
   * Verificar si un producto está en favoritos
   */
  readonly isFavorite = computed(() => {
    const favIds = this.favoriteIds();
    return (productId: string) => favIds.includes(productId);
  });
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor() {
    this.loadFavoritesFromStorage();
    this.loadRecentlyViewedFromStorage();
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - BÚSQUEDA Y LISTADO
  // ========================================================================
  
  /**
   * Obtener productos con filtros y paginación
   */
  async getProducts(params: ProductSearchParams = {}): Promise<ProductsResponse> {
    this.isLoadingSignal.set(true);
    
    try {
      // Construir query params
      let httpParams = new HttpParams();
      
      if (params.query) {
        httpParams = httpParams.set('q', params.query);
      }
      
      if (params.categoryId) {
        httpParams = httpParams.set('categoryId', params.categoryId);
      }
      
      if (params.brandId) {
        httpParams = httpParams.set('brandId', params.brandId);
      }
      
      if (params.filters) {
        const filters = params.filters;
        
        if (filters.categories.length > 0) {
          httpParams = httpParams.set('categories', filters.categories.join(','));
        }
        
        if (filters.brands.length > 0) {
          httpParams = httpParams.set('brands', filters.brands.join(','));
        }
        
        if (filters.minPrice > 0) {
          httpParams = httpParams.set('minPrice', filters.minPrice.toString());
        }
        
        if (filters.maxPrice < 10000) {
          httpParams = httpParams.set('maxPrice', filters.maxPrice.toString());
        }
        
        if (filters.minRating > 0) {
          httpParams = httpParams.set('minRating', filters.minRating.toString());
        }
        
        if (filters.inStockOnly) {
          httpParams = httpParams.set('inStock', 'true');
        }
        
        if (filters.onSale) {
          httpParams = httpParams.set('onSale', 'true');
        }
      }
      
      if (params.sortBy) {
        httpParams = httpParams.set('sortBy', params.sortBy);
      }
      
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      
      // TODO: Llamar al backend real
      // const response = await firstValueFrom(
      //   this.http.get<ProductsResponse>(this.API_URL, { params: httpParams })
      // );
      
      // Simulación con datos mock
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockProducts = this.generateMockProducts(params.limit || 12);
      const response: ProductsResponse = {
        products: mockProducts,
        total: 156,
        page: params.page || 1,
        limit: params.limit || 12,
        totalPages: Math.ceil(156 / (params.limit || 12)),
        hasNext: (params.page || 1) < Math.ceil(156 / (params.limit || 12)),
        hasPrev: (params.page || 1) > 1
      };
      
      // Actualizar caché
      response.products.forEach(product => {
        this.productsCache.update(cache => {
          const newCache = new Map(cache);
          newCache.set(product.id, product);
          return newCache;
        });
      });
      
      // Actualizar productos actuales
      this.currentProducts.set(response.products);
      this.totalProducts.set(response.total);
      this.lastSearchParams.set(params);
      
      return response;
      
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
  
  /**
   * Obtener un producto por ID
   */
  async getProductById(id: string): Promise<Product | null> {
    // Intentar obtener del caché primero
    const cached = this.productsCache().get(id);
    if (cached) {
      this.addToRecentlyViewed(id);
      return cached;
    }
    
    this.isLoadingSignal.set(true);
    
    try {
      // TODO: Llamar al backend real
      // const product = await firstValueFrom(
      //   this.http.get<Product>(`${this.API_URL}/${id}`)
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockProduct = this.generateMockProducts(1)[0];
      mockProduct.id = id;
      
      // Actualizar caché
      this.productsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.set(id, mockProduct);
        return newCache;
      });
      
      this.addToRecentlyViewed(id);
      
      return mockProduct;
      
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
  
  /**
   * Obtener productos relacionados
   */
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    try {
      // TODO: Implementar lógica real de productos relacionados
      // - Misma categoría
      // - Mismo rango de precio
      // - Tags similares
      
      // Simulación
      const mockProducts = this.generateMockProducts(limit);
      return mockProducts;
      
    } catch (error) {
      console.error('Error al obtener productos relacionados:', error);
      return [];
    }
  }
  
  /**
   * Buscar productos por texto
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    try {
      const response = await this.getProducts({ query, limit });
      return response.products;
    } catch (error) {
      console.error('Error al buscar productos:', error);
      return [];
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - FAVORITOS
  // ========================================================================
  
  /**
   * Agregar a favoritos
   */
  addToFavorites(productId: string): void {
    this.favoriteIds.update(ids => {
      if (!ids.includes(productId)) {
        const newIds = [...ids, productId];
        this.saveFavoritesToStorage(newIds);
        return newIds;
      }
      return ids;
    });
  }
  
  /**
   * Remover de favoritos
   */
  removeFromFavorites(productId: string): void {
    this.favoriteIds.update(ids => {
      const newIds = ids.filter(id => id !== productId);
      this.saveFavoritesToStorage(newIds);
      return newIds;
    });
  }
  
  /**
   * Toggle favorito
   */
  toggleFavorite(productId: string): boolean {
    const isFav = this.favoriteIds().includes(productId);
    
    if (isFav) {
      this.removeFromFavorites(productId);
      return false;
    } else {
      this.addToFavorites(productId);
      return true;
    }
  }
  
  /**
   * Limpiar favoritos
   */
  clearFavorites(): void {
    this.favoriteIds.set([]);
    this.saveFavoritesToStorage([]);
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - VISTOS RECIENTEMENTE
  // ========================================================================
  
  /**
   * Agregar a vistos recientemente
   */
  private addToRecentlyViewed(productId: string): void {
    this.recentlyViewedIds.update(ids => {
      // Remover si ya existe
      const filtered = ids.filter(id => id !== productId);
      
      // Agregar al inicio
      const newIds = [productId, ...filtered];
      
      // Limitar a 20 productos
      const limited = newIds.slice(0, 20);
      
      this.saveRecentlyViewedToStorage(limited);
      return limited;
    });
  }
  
  /**
   * Limpiar vistos recientemente
   */
  clearRecentlyViewed(): void {
    this.recentlyViewedIds.set([]);
    this.saveRecentlyViewedToStorage([]);
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - UTILIDADES
  // ========================================================================
  
  /**
   * Convertir Product a ProductCardData
   */
  toProductCardData(product: Product): ProductCardData {
    return {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      images: product.images,
      category: product.categoryName,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      isFavorite: this.favoriteIds().includes(product.id),
      isNew: product.isNew,
      isFeatured: product.isFeatured
    };
  }
  
  /**
   * Limpiar caché
   */
  clearCache(): void {
    this.productsCache.set(new Map());
    this.currentProducts.set([]);
    this.totalProducts.set(0);
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - STORAGE
  // ========================================================================
  
  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem('favorites');
      if (stored) {
        this.favoriteIds.set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    }
  }
  
  private saveFavoritesToStorage(ids: string[]): void {
    try {
      localStorage.setItem('favorites', JSON.stringify(ids));
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
    }
  }
  
  private loadRecentlyViewedFromStorage(): void {
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        this.recentlyViewedIds.set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error al cargar vistos recientemente:', error);
    }
  }
  
  private saveRecentlyViewedToStorage(ids: string[]): void {
    try {
      localStorage.setItem('recently_viewed', JSON.stringify(ids));
    } catch (error) {
      console.error('Error al guardar vistos recientemente:', error);
    }
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - MOCK DATA
  // ========================================================================
  
  /**
   * Generar productos mock para desarrollo
   */
  private generateMockProducts(count: number): Product[] {
    const categories = ['Ropa', 'Deportes', 'Hogar', 'Tecnología', 'Decoración'];
    const brands = ['Nike', 'Adidas', 'Puma', 'Samsung', 'LG'];
    
    return Array.from({ length: count }, (_, i) => {
      const price = Math.floor(Math.random() * 2000) + 100;
      const hasDiscount = Math.random() > 0.6;
      const discount = hasDiscount ? Math.floor(Math.random() * 50) + 10 : 0;
      const originalPrice = hasDiscount ? Math.floor(price / (1 - discount / 100)) : price;
      
      return {
        id: `product-${Date.now()}-${i}`,
        name: `Producto ${i + 1}`,
        slug: `producto-${i + 1}`,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        shortDescription: 'Descripción corta del producto',
        price,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discount: hasDiscount ? discount : undefined,
        images: Array.from({ length: 5 }, (_, j) => `/assets/images/products/product-${(i % 10) + 1}-${j + 1}.jpg`),
        thumbnail: `/assets/images/products/product-${(i % 10) + 1}.jpg`,
        
        categoryId: `cat-${i % 5}`,
        categoryName: categories[i % categories.length],
        brandId: `brand-${i % 5}`,
        brandName: brands[i % brands.length],
        tags: ['nuevo', 'popular', 'oferta'].slice(0, Math.floor(Math.random() * 3) + 1),
        
        sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        barcode: Math.random().toString().substr(2, 13),
        inStock: Math.random() > 0.1,
        stock: Math.floor(Math.random() * 100) + 1,
        lowStockThreshold: 5,
        
        hasVariants: Math.random() > 0.5,
        sizes: Math.random() > 0.5 ? [
          { id: 's', name: 'Small', value: 'S', available: true },
          { id: 'm', name: 'Medium', value: 'M', available: true },
          { id: 'l', name: 'Large', value: 'L', available: true },
        ] : undefined,
        colors: Math.random() > 0.5 ? [
          { id: 'black', name: 'Negro', value: '#000000', available: true, colorHex: '#000000' },
          { id: 'white', name: 'Blanco', value: '#FFFFFF', available: true, colorHex: '#FFFFFF' },
        ] : undefined,
        
        rating: Math.floor(Math.random() * 2) + 3,
        reviewCount: Math.floor(Math.random() * 100) + 5,
        
        features: [
          'Material de alta calidad',
          'Diseño ergonómico',
          'Fácil de limpiar',
          'Garantía de 1 año'
        ],
        specifications: [
          { label: 'Material', value: '100% Algodón', group: 'General' },
          { label: 'Peso', value: '250g', group: 'Dimensiones' },
          { label: 'País de origen', value: 'México', group: 'Origen' },
        ],
        
        isNew: Math.random() > 0.8,
        isFeatured: Math.random() > 0.9,
        isBestseller: Math.random() > 0.85,
        isActive: true,
        
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        
        weight: Math.random() * 1000,
        dimensions: {
          length: Math.random() * 50,
          width: Math.random() * 50,
          height: Math.random() * 50,
          unit: 'cm'
        }
      } as Product;
    });
  }
}
