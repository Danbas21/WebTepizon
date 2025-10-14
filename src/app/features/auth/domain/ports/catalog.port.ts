// ==========================================================
// CATALOG PORT
// ==========================================================
// src/app/features/catalog/domain/ports/catalog.port.ts

import { Observable } from 'rxjs';
import { Product, ProductStatus } from '../../../catalog/domain/entities/product.entity';
import { Category } from '../../../catalog/domain/entities/category.entity';
import { DocumentSnapshot } from '@angular/fire/firestore';

/**
 * Tipos de ordenamiento disponibles
 */
export type SortOption =
    | 'price_asc'
    | 'price_desc'
    | 'name_asc'
    | 'name_desc'
    | 'createdAt_asc'
    | 'createdAt_desc'
    | 'popularity'
    | 'rating';

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
    categoryId?: string;
    status?: ProductStatus;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    isFeatured?: boolean;
    sortBy?: SortOption;
}

/**
 * Respuesta paginada de productos
 */
export interface PaginatedProducts {
    products: Product[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
    total: number;
}

/**
 * Port para operaciones del catálogo
 */
export interface CatalogPort {
    /**
     * Obtener producto por ID
     */
    getProductById(id: string): Observable<Product | null>;

    /**
     * Obtener productos con filtros y paginación
     */
    getProducts(
        filters?: ProductFilters,
        pageSize?: number,
        lastDoc?: DocumentSnapshot
    ): Observable<PaginatedProducts>;

    /**
     * Buscar productos por término
     */
    searchProducts(
        searchTerm: string,
        filters?: ProductFilters,
        pageSize?: number
    ): Observable<PaginatedProducts>;

    /**
     * Obtener productos destacados
     */
    getFeaturedProducts(limit?: number): Observable<Product[]>;

    /**
     * Obtener productos relacionados
     */
    getRelatedProducts(
        productId: string,
        categoryId: string,
        limit?: number
    ): Observable<Product[]>;

    /**
     * Obtener todas las categorías
     */
    getCategories(): Observable<Category[]>;

    /**
     * Obtener categoría por ID
     */
    getCategoryById(id: string): Observable<Category | null>;

    /**
     * Obtener categoría por slug
     */
    getCategoryBySlug(slug: string): Observable<Category | null>;

    /**
     * Registrar vista de producto
     */
    trackProductView(productId: string, userId?: string): Observable<void>;

    /**
     * Obtener productos vistos recientemente
     */
    getRecentlyViewedProducts(userId: string, limit?: number): Observable<Product[]>;
}
