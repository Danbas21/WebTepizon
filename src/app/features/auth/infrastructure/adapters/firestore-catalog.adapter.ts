// src/app/features/catalog/infrastructure/adapters/firestore-catalog.adapter.ts

import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    QueryConstraint,
    DocumentSnapshot,
    collectionGroup,
    increment,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, throwError } from 'rxjs';

// Domain
import { Product, ProductStatus } from '../../../catalog/domain/entities/product.entity';
import { Category } from '../../../catalog/domain/entities/category.entity';
import {
    CatalogPort,
    ProductFilters,
    PaginatedProducts,
    SortOption
} from '../../domain/ports/catalog.port';
import { CatalogError } from '../../domain/errors/catalog.errors';

/**
 * Adapter para Firestore - Catálogo de productos
 * Maneja toda la comunicación con Firestore para productos y categorías
 */
@Injectable({
    providedIn: 'root',
})
export class FirestoreCatalogAdapter implements CatalogPort {
    private readonly firestore = inject(Firestore);

    private readonly productsCollection = collection(this.firestore, 'products');
    private readonly categoriesCollection = collection(this.firestore, 'categories');

    /**
     * Obtener producto por ID
     */
    getProductById(id: string): Observable<Product | null> {
        const productDoc = doc(this.firestore, 'products', id);

        return from(getDoc(productDoc)).pipe(
            map((snapshot) => {
                if (!snapshot.exists()) return null;
                return this.mapFirestoreToProduct(snapshot);
            }),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener productos con filtros y paginación
     */
    getProducts(
        filters: ProductFilters = {},
        pageSize: number = 20,
        lastDoc?: DocumentSnapshot
    ): Observable<PaginatedProducts> {
        const constraints: QueryConstraint[] = [];

        // Aplicar filtros
        if (filters.categoryId) {
            constraints.push(where('categoryId', '==', filters.categoryId));
        }

        if (filters.status) {
            constraints.push(where('status', '==', filters.status));
        } else {
            // Por defecto solo productos activos
            constraints.push(where('status', '==', 'ACTIVE'));
        }

        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                constraints.push(where('stock', '>', 0));
            } else {
                constraints.push(where('stock', '==', 0));
            }
        }

        if (filters.minPrice !== undefined) {
            constraints.push(where('price', '>=', filters.minPrice));
        }

        if (filters.maxPrice !== undefined) {
            constraints.push(where('price', '<=', filters.maxPrice));
        }

        if (filters.isFeatured !== undefined) {
            constraints.push(where('isFeatured', '==', filters.isFeatured));
        }

        // Aplicar ordenamiento
        const sortOption = filters.sortBy || 'createdAt_desc';
        const [sortField, sortDirection] = this.parseSortOption(sortOption);
        constraints.push(orderBy(sortField, sortDirection));

        // Paginación
        constraints.push(limit(pageSize));
        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(this.productsCollection, ...constraints);

        return from(getDocs(q)).pipe(
            map((querySnapshot) => {
                const products = querySnapshot.docs.map((doc) =>
                    this.mapFirestoreToProduct(doc)
                );

                const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                return {
                    products,
                    hasMore: querySnapshot.docs.length === pageSize,
                    lastDoc: lastVisible,
                    total: querySnapshot.size, // Solo para la página actual
                };
            }),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Búsqueda de productos por término
     * NOTA: Firestore no soporta búsqueda full-text nativa
     * Alternativas: Algolia, Elasticsearch, o array-contains para tags
     */
    searchProducts(
        searchTerm: string,
        filters: ProductFilters = {},
        pageSize: number = 20
    ): Observable<PaginatedProducts> {
        const constraints: QueryConstraint[] = [];

        // Búsqueda básica por tags (requiere que los tags incluyan palabras del nombre)
        const searchLower = searchTerm.toLowerCase();
        constraints.push(where('tags', 'array-contains', searchLower));

        // Aplicar filtros adicionales
        if (filters.categoryId) {
            constraints.push(where('categoryId', '==', filters.categoryId));
        }

        constraints.push(where('status', '==', 'ACTIVE'));
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(pageSize));

        const q = query(this.productsCollection, ...constraints);

        return from(getDocs(q)).pipe(
            map((querySnapshot) => {
                const products = querySnapshot.docs
                    .map((doc) => this.mapFirestoreToProduct(doc))
                    .filter((product) => {
                        // Filtro adicional en memoria para mejor precisión
                        const searchableText = `
              ${product.name} 
              ${product.description} 
              ${product.tags?.join(' ') || ''}
            `.toLowerCase();

                        return searchableText.includes(searchLower);
                    });

                return {
                    products,
                    hasMore: false, // La búsqueda no soporta paginación avanzada
                    lastDoc: undefined,
                    total: products.length,
                };
            }),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener productos destacados (featured)
     */
    getFeaturedProducts(maxLimit: number = 10): Observable<Product[]> {
        const constraints: QueryConstraint[] = [
            where('status', '==', 'ACTIVE'),
            where('isFeatured', '==', true),
            orderBy('createdAt', 'desc'),
            limit(maxLimit),
        ];

        const q = query(this.productsCollection, ...constraints);

        return from(getDocs(q)).pipe(
            map((querySnapshot) =>
                querySnapshot.docs.map((doc) => this.mapFirestoreToProduct(doc))
            ),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener productos relacionados
     * (Misma categoría, excluyendo el producto actual)
     */
    getRelatedProducts(
        productId: string,
        categoryId: string,
        maxLimit: number = 6
    ): Observable<Product[]> {
        const constraints: QueryConstraint[] = [
            where('categoryId', '==', categoryId),
            where('status', '==', 'ACTIVE'),
            orderBy('createdAt', 'desc'),
            limit(maxLimit + 1), // +1 para excluir el producto actual
        ];

        const q = query(this.productsCollection, ...constraints);

        return from(getDocs(q)).pipe(
            map((querySnapshot) =>
                querySnapshot.docs
                    .map((doc) => this.mapFirestoreToProduct(doc))
                    .filter((product) => product.id !== productId) // Excluir producto actual
                    .slice(0, maxLimit)
            ),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener todas las categorías
     */
    getCategories(): Observable<Category[]> {
        const q = query(
            this.categoriesCollection,
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );

        return from(getDocs(q)).pipe(
            map((querySnapshot) =>
                querySnapshot.docs.map((doc) => this.mapFirestoreToCategory(doc))
            ),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener categoría por ID
     */
    getCategoryById(id: string): Observable<Category | null> {
        const categoryDoc = doc(this.firestore, 'categories', id);

        return from(getDoc(categoryDoc)).pipe(
            map((snapshot) => {
                if (!snapshot.exists()) return null;
                return this.mapFirestoreToCategory(snapshot);
            }),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Obtener categoría por slug
     */
    getCategoryBySlug(slug: string): Observable<Category | null> {
        const q = query(
            this.categoriesCollection,
            where('slug', '==', slug),
            where('isActive', '==', true)
        );

        return from(getDocs(q)).pipe(
            map((querySnapshot) => {
                if (querySnapshot.empty) return null;
                return this.mapFirestoreToCategory(querySnapshot.docs[0]);
            }),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    /**
     * Registrar vista de producto (para analytics)
     */
    trackProductView(productId: string, userId?: string): Observable<void> {
        const productDoc = doc(this.firestore, 'products', productId);

        const updateData: any = {
            views: increment(1),
            lastViewedAt: new Date(),
        };

        if (userId) {
            updateData.viewedByUsers = arrayUnion(userId);
        }

        return from(updateDoc(productDoc, updateData)).pipe(
            catchError((error) => {
                console.error('Error tracking product view:', error);
                return from(Promise.resolve()); // No bloqueamos por error en analytics
            })
        );
    }

    /**
     * Obtener productos vistos recientemente por el usuario
     */
    getRecentlyViewedProducts(
        userId: string,
        maxLimit: number = 10
    ): Observable<Product[]> {
        // Requiere índice compuesto: viewedByUsers + lastViewedAt
        const q = query(
            this.productsCollection,
            where('viewedByUsers', 'array-contains', userId),
            where('status', '==', 'ACTIVE'),
            orderBy('lastViewedAt', 'desc'),
            limit(maxLimit)
        );

        return from(getDocs(q)).pipe(
            map((querySnapshot) =>
                querySnapshot.docs.map((doc) => this.mapFirestoreToProduct(doc))
            ),
            catchError((error) => throwError(() => this.handleCatalogError(error)))
        );
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Mapea documento de Firestore a entidad Product del dominio
     */
    private mapFirestoreToProduct(doc: DocumentSnapshot): Product {
        const data = doc.data();
        if (!data) {
            throw new CatalogError('INVALID_DATA', 'Product data is missing');
        }

        return {
            id: doc.id,
            name: data['name'],
            slug: data['slug'],
            description: data['description'],
            shortDescription: data['shortDescription'],
            price: data['price'],
            compareAtPrice: data['compareAtPrice'],
            cost: data['cost'],
            sku: data['sku'],
            barcode: data['barcode'],
            stock: data['stock'],
            lowStockThreshold: data['lowStockThreshold'] || 5,
            categoryId: data['categoryId'],
            categoryName: data['categoryName'],
            images: data['images'] || [],
            thumbnail: data['thumbnail'],
            tags: data['tags'] || [],
            status: data['status'] as ProductStatus,
            isFeatured: data['isFeatured'] || false,
            weight: data['weight'],
            dimensions: data['dimensions'],
            seo: data['seo'],
            views: data['views'] || 0,
            purchaseCount: data['purchaseCount'] || 0,
            rating: data['rating'] || 0,
            reviewCount: data['reviewCount'] || 0,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            lastViewedAt: data['lastViewedAt']?.toDate(),
        };
    }

    /**
     * Mapea documento de Firestore a entidad Category del dominio
     */
    private mapFirestoreToCategory(doc: DocumentSnapshot): Category {
        const data = doc.data();
        if (!data) {
            throw new CatalogError('INVALID_DATA', 'Category data is missing');
        }

        return {
            id: doc.id,
            name: data['name'],
            slug: data['slug'],
            description: data['description'],
            image: data['image'],
            icon: data['icon'],
            parentId: data['parentId'],
            order: data['order'] || 0,
            isActive: data['isActive'],
            productCount: data['productCount'] || 0,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
        };
    }

    /**
     * Parsea opción de ordenamiento
     */
    private parseSortOption(sortOption: SortOption): [string, 'asc' | 'desc'] {
        const sortMap: Record<SortOption, [string, 'asc' | 'desc']> = {
            price_asc: ['price', 'asc'],
            price_desc: ['price', 'desc'],
            name_asc: ['name', 'asc'],
            name_desc: ['name', 'desc'],
            createdAt_asc: ['createdAt', 'asc'],
            createdAt_desc: ['createdAt', 'desc'],
            popularity: ['purchaseCount', 'desc'],
            rating: ['rating', 'desc'],
        };

        return sortMap[sortOption] || ['createdAt', 'desc'];
    }

    /**
     * Maneja errores de Firestore y los convierte a errores del dominio
     */
    private handleCatalogError(error: any): CatalogError {
        const code = error?.code || 'UNKNOWN';
        const message = error?.message || 'An unknown error occurred';

        const errorMap: Record<string, { code: string; message: string }> = {
            'permission-denied': {
                code: 'PERMISSION_DENIED',
                message: 'No tienes permisos para esta operación',
            },
            'not-found': {
                code: 'NOT_FOUND',
                message: 'Producto no encontrado',
            },
            'unavailable': {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Servicio temporalmente no disponible',
            },
            'failed-precondition': {
                code: 'MISSING_INDEX',
                message: 'Índice de base de datos requerido no configurado',
            },
        };

        const mappedError = errorMap[code] || {
            code: 'UNKNOWN',
            message: message,
        };

        return new CatalogError(mappedError.code, mappedError.message, error);
    }
}