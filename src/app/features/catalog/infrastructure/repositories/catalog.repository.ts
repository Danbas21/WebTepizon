// src/app/features/catalog/infrastructure/repositories/catalog.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DocumentSnapshot } from '@angular/fire/firestore';

// Domain
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import {
    CatalogPort,
    ProductFilters,
    PaginatedProducts
} from '../../domain/ports/catalog.port';

// Infrastructure
import { FirestoreCatalogAdapter } from '../adapters/firestore-catalog.adapter';

/**
 * Repository de Catálogo
 * Abstrae el acceso a productos y categorías
 * Implementa el patrón Repository
 */
@Injectable({
    providedIn: 'root',
})
export class CatalogRepository implements CatalogPort {
    private readonly catalogAdapter = inject(FirestoreCatalogAdapter);

    getProductById(id: string): Observable<Product | null> {
        return this.catalogAdapter.getProductById(id);
    }

    getProducts(
        filters?: ProductFilters,
        pageSize?: number,
        lastDoc?: DocumentSnapshot
    ): Observable<PaginatedProducts> {
        return this.catalogAdapter.getProducts(filters, pageSize, lastDoc);
    }

    searchProducts(
        searchTerm: string,
        filters?: ProductFilters,
        pageSize?: number
    ): Observable<PaginatedProducts> {
        return this.catalogAdapter.searchProducts(searchTerm, filters, pageSize);
    }

    getFeaturedProducts(limit?: number): Observable<Product[]> {
        return this.catalogAdapter.getFeaturedProducts(limit);
    }

    getRelatedProducts(
        productId: string,
        categoryId: string,
        limit?: number
    ): Observable<Product[]> {
        return this.catalogAdapter.getRelatedProducts(productId, categoryId, limit);
    }

    getCategories(): Observable<Category[]> {
        return this.catalogAdapter.getCategories();
    }

    getCategoryById(id: string): Observable<Category | null> {
        return this.catalogAdapter.getCategoryById(id);
    }

    getCategoryBySlug(slug: string): Observable<Category | null> {
        return this.catalogAdapter.getCategoryBySlug(slug);
    }

    trackProductView(productId: string, userId?: string): Observable<void> {
        return this.catalogAdapter.trackProductView(productId, userId);
    }

    getRecentlyViewedProducts(userId: string, limit?: number): Observable<Product[]> {
        return this.catalogAdapter.getRecentlyViewedProducts(userId, limit);
    }
}