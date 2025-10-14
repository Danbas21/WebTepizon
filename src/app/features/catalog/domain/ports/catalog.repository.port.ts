/**
 * Catalog Repository Port
 * 
 * Define el contrato que deben cumplir las implementaciones del repositorio
 * de catálogo. Maneja productos y categorías.
 * 
 * @pattern Port (Hexagonal Architecture)
 */

import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { Category, CategoryWithChildren } from '../models/category.model';
import {
  ProductFilter,
  ProductSort,
  ProductQueryResult,
  ProductPagination,
} from '../models/product-filter.model';

export interface GetProductsParams {
  filter?: ProductFilter;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  basePrice?: number;
  stock?: number;
  isActive?: boolean;
}

/**
 * Puerto del repositorio de catálogo
 * 
 * Las implementaciones de esta interfaz deben manejar:
 * - Consulta de productos con filtros y paginación
 * - Consulta de categorías con jerarquía
 * - Gestión de stock en tiempo real
 * - Analytics de productos
 */
export abstract class CatalogRepositoryPort {
  // ==================== PRODUCTS ====================

  /**
   * Obtiene productos con filtros, ordenamiento y paginación
   * 
   * @param params - Parámetros de consulta
   * @returns Promise con resultado paginado
   */
  abstract getProducts(params: GetProductsParams): Promise<ProductQueryResult>;

  /**
   * Obtiene un producto por ID
   * 
   * @param productId - ID del producto
   * @returns Promise con el producto o null si no existe
   */
  abstract getProductById(productId: string): Promise<Product | null>;

  /**
   * Obtiene un producto por slug (para URLs amigables)
   * 
   * @param slug - Slug del producto
   * @returns Promise con el producto o null si no existe
   */
  abstract getProductBySlug(slug: string): Promise<Product | null>;

  /**
   * Busca productos por texto
   * 
   * @param query - Texto de búsqueda
   * @param limit - Número máximo de resultados
   * @returns Promise con productos encontrados
   */
  abstract searchProducts(query: string, limit?: number): Promise<Product[]>;

  /**
   * Obtiene productos relacionados a uno dado
   * 
   * @param productId - ID del producto base
   * @param limit - Número máximo de resultados
   * @returns Promise con productos relacionados
   */
  abstract getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;

  /**
   * Obtiene productos destacados
   * 
   * @param limit - Número máximo de resultados
   * @returns Promise con productos destacados
   */
  abstract getFeaturedProducts(limit?: number): Promise<Product[]>;

  /**
   * Obtiene productos nuevos
   * 
   * @param limit - Número máximo de resultados
   * @returns Promise con productos nuevos
   */
  abstract getNewProducts(limit?: number): Promise<Product[]>;

  /**
   * Obtiene productos más vendidos
   * 
   * @param limit - Número máximo de resultados
   * @returns Promise con productos más vendidos
   */
  abstract getBestSellingProducts(limit?: number): Promise<Product[]>;

  /**
   * Observable del stock de un producto en tiempo real
   * Emite cada vez que cambia el stock
   * 
   * @param productId - ID del producto
   * @returns Observable con el producto actualizado
   */
  abstract watchProductStock(productId: string): Observable<Product>;

  /**
   * Verifica disponibilidad de una variante
   * 
   * @param productId - ID del producto
   * @param variantId - ID de la variante
   * @param quantity - Cantidad deseada
   * @returns Promise con disponibilidad
   */
  abstract checkVariantAvailability(
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<boolean>;

  // ==================== CATEGORIES ====================

  /**
   * Obtiene todas las categorías
   * 
   * @param includeInactive - Incluir categorías inactivas
   * @returns Promise con lista de categorías
   */
  abstract getCategories(includeInactive?: boolean): Promise<Category[]>;

  /**
   * Obtiene el árbol de categorías
   * 
   * @returns Promise con árbol jerárquico
   */
  abstract getCategoryTree(): Promise<CategoryWithChildren[]>;

  /**
   * Obtiene una categoría por ID
   * 
   * @param categoryId - ID de la categoría
   * @returns Promise con la categoría o null si no existe
   */
  abstract getCategoryById(categoryId: string): Promise<Category | null>;

  /**
   * Obtiene una categoría por slug
   * 
   * @param slug - Slug de la categoría
   * @returns Promise con la categoría o null si no existe
   */
  abstract getCategoryBySlug(slug: string): Promise<Category | null>;

  /**
   * Obtiene subcategorías de una categoría
   * 
   * @param parentId - ID de la categoría padre (null para raíz)
   * @returns Promise con subcategorías
   */
  abstract getSubcategories(parentId: string | null): Promise<Category[]>;

  /**
   * Obtiene el path completo de una categoría
   * 
   * @param categoryId - ID de la categoría
   * @returns Promise con array de categorías desde raíz
   */
  abstract getCategoryPath(categoryId: string): Promise<Category[]>;

  // ==================== ANALYTICS ====================

  /**
   * Registra una vista de producto
   * 
   * @param productId - ID del producto
   * @param userId - ID del usuario (opcional)
   */
  abstract trackProductView(productId: string, userId?: string): Promise<void>;

  /**
   * Registra un click en producto
   * 
   * @param productId - ID del producto
   * @param userId - ID del usuario (opcional)
   */
  abstract trackProductClick(productId: string, userId?: string): Promise<void>;

  /**
   * Registra tiempo en página de producto
   * 
   * @param productId - ID del producto
   * @param timeInSeconds - Tiempo en segundos
   * @param userId - ID del usuario (opcional)
   */
  abstract trackProductTimeOnPage(
    productId: string,
    timeInSeconds: number,
    userId?: string
  ): Promise<void>;

  /**
   * Obtiene productos más vistos recientemente
   * 
   * @param limit - Número máximo de resultados
   * @returns Promise con productos más vistos
   */
  abstract getMostViewedProducts(limit?: number): Promise<Product[]>;

  // ==================== FILTERS ====================

  /**
   * Obtiene valores disponibles para filtros
   * Útil para construir UI de filtros dinámicamente
   * 
   * @param categoryId - ID de categoría (opcional)
   * @returns Promise con valores disponibles
   */
  abstract getAvailableFilterValues(categoryId?: string): Promise<{
    brands: string[];
    sizes: string[];
    colors: string[];
    priceRange: { min: number; max: number };
    maxRating: number;
  }>;

  /**
   * Obtiene el conteo de productos por filtro
   * Útil para mostrar "(23)" junto a cada opción de filtro
   * 
   * @param filter - Filtro actual
   * @returns Promise con conteos por categoría
   */
  abstract getProductCountsByFilter(
    filter: ProductFilter
  ): Promise<Record<string, number>>;
}
