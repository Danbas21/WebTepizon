// src/app/features/catalog/application/use-cases/catalog.use-cases.ts

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { DocumentSnapshot } from '@angular/fire/firestore';

// Domain
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import { ProductFilters, PaginatedProducts } from '../../domain/ports/catalog.port';

// Infrastructure
import { CatalogRepository } from '../../infrastructure/repositories/catalog.repository';

// Auth (para tracking de vistas)
import { AuthRepository } from '@features/auth/infrastructure/repositories/auth.repository';

/**
 * Use Cases del Catálogo
 * Contienen la lógica de negocio para gestión de productos y categorías
 */
@Injectable({
    providedIn: 'root',
})
export class CatalogUseCases {
    private readonly catalogRepository = inject(CatalogRepository);
    private readonly authRepository = inject(AuthRepository);

    /**
     * Use Case: Obtener producto por ID
     * Incluye tracking automático de vistas
     */
    getProductById(id: string): Observable<Product | null> {
        return this.catalogRepository.getProductById(id).pipe(
            tap((product) => {
                if (product) {
                    // Registrar vista del producto
                    const userId = this.authRepository.currentUser()?.id;
                    this.catalogRepository.trackProductView(id, userId).subscribe();
                }
            }),
            catchError((error) => {
                console.error('Error fetching product:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener productos con filtros
     * Aplica validaciones y configuración por defecto
     */
    getProducts(
        filters: ProductFilters = {},
        pageSize: number = 20,
        lastDoc?: DocumentSnapshot
    ): Observable<PaginatedProducts> {
        // Validaciones
        if (pageSize < 1 || pageSize > 100) {
            throw new Error('Page size must be between 1 and 100');
        }

        if (filters.minPrice && filters.minPrice < 0) {
            throw new Error('Minimum price cannot be negative');
        }

        if (filters.maxPrice && filters.maxPrice < 0) {
            throw new Error('Maximum price cannot be negative');
        }

        if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
            throw new Error('Minimum price cannot be greater than maximum price');
        }

        return this.catalogRepository.getProducts(filters, pageSize, lastDoc).pipe(
            tap((result) => {
                console.log(`Fetched ${result.products.length} products`);
            }),
            catchError((error) => {
                console.error('Error fetching products:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Buscar productos
     * Limpia el término de búsqueda y aplica filtros
     */
    searchProducts(
        searchTerm: string,
        filters: ProductFilters = {},
        pageSize: number = 20
    ): Observable<PaginatedProducts> {
        // Limpiar y validar término de búsqueda
        const cleanedTerm = searchTerm.trim().toLowerCase();

        if (!cleanedTerm) {
            throw new Error('Search term cannot be empty');
        }

        if (cleanedTerm.length < 2) {
            throw new Error('Search term must be at least 2 characters');
        }

        console.log('Searching products with term:', cleanedTerm);

        return this.catalogRepository.searchProducts(cleanedTerm, filters, pageSize).pipe(
            tap((result) => {
                console.log(`Found ${result.products.length} products matching "${cleanedTerm}"`);

                // Analytics
                // this.analytics.trackEvent('product_search', {
                //   searchTerm: cleanedTerm,
                //   resultsCount: result.products.length,
                // });
            }),
            catchError((error) => {
                console.error('Error searching products:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener productos destacados
     * Para homepage o secciones especiales
     */
    getFeaturedProducts(limit: number = 10): Observable<Product[]> {
        if (limit < 1 || limit > 50) {
            throw new Error('Limit must be between 1 and 50');
        }

        return this.catalogRepository.getFeaturedProducts(limit).pipe(
            tap((products) => {
                console.log(`Fetched ${products.length} featured products`);
            }),
            catchError((error) => {
                console.error('Error fetching featured products:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener productos relacionados
     * Para página de detalle de producto
     */
    getRelatedProducts(
        productId: string,
        categoryId: string,
        limit: number = 6
    ): Observable<Product[]> {
        if (!productId || !categoryId) {
            throw new Error('Product ID and category ID are required');
        }

        return this.catalogRepository.getRelatedProducts(productId, categoryId, limit).pipe(
            tap((products) => {
                console.log(`Fetched ${products.length} related products`);
            }),
            catchError((error) => {
                console.error('Error fetching related products:', error);
                return of([]); // No bloquear si falla
            })
        );
    }

    /**
     * Use Case: Obtener todas las categorías
     * Con cache opcional
     */
    getCategories(): Observable<Category[]> {
        return this.catalogRepository.getCategories().pipe(
            tap((categories) => {
                console.log(`Fetched ${categories.length} categories`);
            }),
            catchError((error) => {
                console.error('Error fetching categories:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener categoría por slug
     * Para URLs amigables
     */
    getCategoryBySlug(slug: string): Observable<Category | null> {
        if (!slug) {
            throw new Error('Category slug is required');
        }

        return this.catalogRepository.getCategoryBySlug(slug).pipe(
            tap((category) => {
                if (category) {
                    console.log('Found category:', category.name);
                } else {
                    console.log('Category not found:', slug);
                }
            }),
            catchError((error) => {
                console.error('Error fetching category:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener productos vistos recientemente
     * Requiere usuario autenticado
     */
    getRecentlyViewedProducts(limit: number = 10): Observable<Product[]> {
        const userId = this.authRepository.currentUser()?.id;

        if (!userId) {
            return of([]); // Sin usuario, no hay historial
        }

        if (limit < 1 || limit > 50) {
            throw new Error('Limit must be between 1 and 50');
        }

        return this.catalogRepository.getRecentlyViewedProducts(userId, limit).pipe(
            tap((products) => {
                console.log(`Fetched ${products.length} recently viewed products`);
            }),
            catchError((error) => {
                console.error('Error fetching recently viewed products:', error);
                return of([]); // No bloquear si falla
            })
        );
    }

    /**
     * Use Case: Obtener página de producto completa
     * Incluye producto, relacionados y categoría en una sola llamada
     */
    getProductPage(productId: string): Observable<{
        product: Product | null;
        relatedProducts: Product[];
        category: Category | null;
    }> {
        return this.getProductById(productId).pipe(
            switchMap((product) => {
                if (!product) {
                    return of({
                        product: null,
                        relatedProducts: [],
                        category: null,
                    });
                }

                // Obtener datos relacionados en paralelo
                return forkJoin({
                    product: of(product),
                    relatedProducts: this.getRelatedProducts(
                        product.id,
                        product.categoryId,
                        6
                    ),
                    category: this.catalogRepository.getCategoryById(product.categoryId),
                });
            }),
            catchError((error) => {
                console.error('Error loading product page:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Verificar disponibilidad de stock
     * Para validación antes de agregar al carrito
     */
    checkProductAvailability(
        productId: string,
        quantity: number
    ): Observable<{ available: boolean; stock: number }> {
        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        return this.catalogRepository.getProductById(productId).pipe(
            map((product) => {
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }

                if (product.status !== 'ACTIVE') {
                    return { available: false, stock: 0 };
                }

                return {
                    available: product.stock >= quantity,
                    stock: product.stock,
                };
            }),
            catchError((error) => {
                console.error('Error checking product availability:', error);
                throw error;
            })
        );
    }
}