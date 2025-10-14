// src/app/features/catalog/application/facades/catalog.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, catchError, of, tap } from 'rxjs';
import { DocumentSnapshot } from '@angular/fire/firestore';

// Domain
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import { ProductFilters, PaginatedProducts } from '../../domain/ports/catalog.port';

// Application
import { CatalogUseCases } from '../use-cases/catalog.use-cases';

/**
 * Estado de la UI para catálogo
 */
interface CatalogState {
    loading: boolean;
    error: string | null;
    selectedProduct: Product | null;
    selectedCategory: Category | null;
}

/**
 * Catalog Facade
 * API simplificada para la UI del catálogo
 * Maneja estado de loading, errores y caché
 */
@Injectable({
    providedIn: 'root',
})
export class CatalogFacade {
    private readonly catalogUseCases = inject(CatalogUseCases);

    // ========== STATE MANAGEMENT ==========

    /**
     * Signal de estado de la UI
     */
    private readonly catalogState = signal<CatalogState>({
        loading: false,
        error: null,
        selectedProduct: null,
        selectedCategory: null,
    });

    /**
     * Signals derivados
     */
    readonly isLoading = computed(() => this.catalogState().loading);
    readonly error = computed(() => this.catalogState().error);
    readonly selectedProduct = computed(() => this.catalogState().selectedProduct);
    readonly selectedCategory = computed(() => this.catalogState().selectedCategory);

    /**
     * Cache de productos y categorías
     */
    private readonly productsCache = new BehaviorSubject<Product[]>([]);
    private readonly categoriesCache = new BehaviorSubject<Category[]>([]);
    private readonly featuredProductsCache = new BehaviorSubject<Product[]>([]);

    /**
     * Observables de cache
     */
    readonly products$ = this.productsCache.asObservable();
    readonly categories$ = this.categoriesCache.asObservable();
    readonly featuredProducts$ = this.featuredProductsCache.asObservable();

    // ========== MÉTODOS PÚBLICOS ==========

    /**
     * Obtener producto por ID
     */
    getProductById(id: string): Observable<Product | null> {
        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getProductById(id).pipe(
            tap({
                next: (product) => {
                    this.setLoading(false);
                    if (product) {
                        this.catalogState.update((state) => ({
                            ...state,
                            selectedProduct: product,
                        }));
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of(null);
            })
        );
    }

    /**
     * Obtener productos con filtros
     */
    getProducts(
        filters: ProductFilters = {},
        pageSize: number = 20,
        lastDoc?: DocumentSnapshot
    ): Observable<PaginatedProducts> {
        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getProducts(filters, pageSize, lastDoc).pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    this.productsCache.next(result.products);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of({
                    products: [],
                    hasMore: false,
                    total: 0,
                });
            })
        );
    }

    /**
     * Buscar productos
     */
    searchProducts(
        searchTerm: string,
        filters: ProductFilters = {},
        pageSize: number = 20
    ): Observable<PaginatedProducts> {
        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.searchProducts(searchTerm, filters, pageSize).pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    this.productsCache.next(result.products);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of({
                    products: [],
                    hasMore: false,
                    total: 0,
                });
            })
        );
    }

    /**
     * Obtener productos destacados
     */
    getFeaturedProducts(limit: number = 10): Observable<Product[]> {
        // Si ya tenemos cache y no ha pasado mucho tiempo, usarlo
        const cached = this.featuredProductsCache.value;
        if (cached.length > 0) {
            return of(cached);
        }

        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getFeaturedProducts(limit).pipe(
            tap({
                next: (products) => {
                    this.setLoading(false);
                    this.featuredProductsCache.next(products);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of([]);
            })
        );
    }

    /**
     * Obtener productos relacionados
     */
    getRelatedProducts(
        productId: string,
        categoryId: string,
        limit: number = 6
    ): Observable<Product[]> {
        return this.catalogUseCases.getRelatedProducts(productId, categoryId, limit).pipe(
            catchError((error) => {
                console.error('Error loading related products:', error);
                return of([]);
            })
        );
    }

    /**
     * Obtener todas las categorías
     */
    getCategories(): Observable<Category[]> {
        // Si ya tenemos cache, usarlo
        const cached = this.categoriesCache.value;
        if (cached.length > 0) {
            return of(cached);
        }

        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getCategories().pipe(
            tap({
                next: (categories) => {
                    this.setLoading(false);
                    this.categoriesCache.next(categories);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of([]);
            })
        );
    }

    /**
     * Obtener categoría por slug
     */
    getCategoryBySlug(slug: string): Observable<Category | null> {
        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getCategoryBySlug(slug).pipe(
            tap({
                next: (category) => {
                    this.setLoading(false);
                    if (category) {
                        this.catalogState.update((state) => ({
                            ...state,
                            selectedCategory: category,
                        }));
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of(null);
            })
        );
    }

    /**
     * Obtener productos vistos recientemente
     */
    getRecentlyViewedProducts(limit: number = 10): Observable<Product[]> {
        return this.catalogUseCases.getRecentlyViewedProducts(limit).pipe(
            catchError((error) => {
                console.error('Error loading recently viewed products:', error);
                return of([]);
            })
        );
    }

    /**
     * Obtener página de producto completa
     */
    getProductPage(productId: string): Observable<{
        product: Product | null;
        relatedProducts: Product[];
        category: Category | null;
    }> {
        this.setLoading(true);
        this.clearError();

        return this.catalogUseCases.getProductPage(productId).pipe(
            tap({
                next: (data) => {
                    this.setLoading(false);
                    if (data.product) {
                        this.catalogState.update((state) => ({
                            ...state,
                            selectedProduct: data.product,
                            selectedCategory: data.category,
                        }));
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of({
                    product: null,
                    relatedProducts: [],
                    category: null,
                });
            })
        );
    }

    /**
     * Verificar disponibilidad de producto
     */
    checkProductAvailability(
        productId: string,
        quantity: number
    ): Observable<{ available: boolean; stock: number }> {
        return this.catalogUseCases.checkProductAvailability(productId, quantity).pipe(
            catchError((error) => {
                console.error('Error checking product availability:', error);
                return of({ available: false, stock: 0 });
            })
        );
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.catalogState.update((state) => ({ ...state, error: null }));
    }

    /**
     * Limpiar producto seleccionado
     */
    clearSelectedProduct(): void {
        this.catalogState.update((state) => ({ ...state, selectedProduct: null }));
    }

    /**
     * Limpiar categoría seleccionada
     */
    clearSelectedCategory(): void {
        this.catalogState.update((state) => ({ ...state, selectedCategory: null }));
    }

    /**
     * Limpiar cache
     */
    clearCache(): void {
        this.productsCache.next([]);
        this.categoriesCache.next([]);
        this.featuredProductsCache.next([]);
    }

    // ========== MÉTODOS PRIVADOS ==========

    private setLoading(loading: boolean): void {
        this.catalogState.update((state) => ({ ...state, loading }));
    }

    private setError(error: string): void {
        this.catalogState.update((state) => ({ ...state, error }));
    }

    private getErrorMessage(error: any): string {
        if (error?.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'Ocurrió un error al cargar los productos.';
    }
}