/**
 * Catalog Repository Implementation
 * 
 * Implementación concreta del puerto CatalogRepositoryPort.
 * Delega las operaciones al FirebaseCatalogAdapter.
 * 
 * @pattern Repository (Hexagonal Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CatalogRepositoryPort, GetProductsParams } from '../../domain/ports/catalog.repository.port';
import { Product } from '../../domain/models/product.model';
import { Category, CategoryWithChildren } from '../../domain/models/category.model';
import { ProductFilter, ProductQueryResult } from '../../domain/models/product-filter.model';
import { FirebaseCatalogAdapter } from '../adapters/firebase-catalog.adapter';

/**
 * Implementación del repositorio de catálogo
 * 
 * Esta clase actúa como un puente entre el dominio y la infraestructura.
 * Todas las operaciones se delegan al adapter de Firebase.
 */
@Injectable({
  providedIn: 'root',
})
export class CatalogRepositoryImpl extends CatalogRepositoryPort {
  private readonly adapter = inject(FirebaseCatalogAdapter);

  // ==================== PRODUCTS ====================

  override async getProducts(params: GetProductsParams): Promise<ProductQueryResult> {
    return this.adapter.getProducts(params);
  }

  override async getProductById(productId: string): Promise<Product | null> {
    return this.adapter.getProductById(productId);
  }

  override async getProductBySlug(slug: string): Promise<Product | null> {
    return this.adapter.getProductBySlug(slug);
  }

  override async searchProducts(query: string, limit = 10): Promise<Product[]> {
    return this.adapter.searchProducts(query, limit);
  }

  override async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    return this.adapter.getRelatedProducts(productId, limit);
  }

  override async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return this.adapter.getFeaturedProducts(limit);
  }

  override async getNewProducts(limit = 8): Promise<Product[]> {
    return this.adapter.getNewProducts(limit);
  }

  override async getBestSellingProducts(limit = 8): Promise<Product[]> {
    return this.adapter.getBestSellingProducts(limit);
  }

  override watchProductStock(productId: string): Observable<Product> {
    return this.adapter.watchProductStock(productId);
  }

  override async checkVariantAvailability(
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<boolean> {
    return this.adapter.checkVariantAvailability(productId, variantId, quantity);
  }

  // ==================== CATEGORIES ====================

  override async getCategories(includeInactive = false): Promise<Category[]> {
    return this.adapter.getCategories(includeInactive);
  }

  override async getCategoryTree(): Promise<CategoryWithChildren[]> {
    return this.adapter.getCategoryTree();
  }

  override async getCategoryById(categoryId: string): Promise<Category | null> {
    return this.adapter.getCategoryById(categoryId);
  }

  override async getCategoryBySlug(slug: string): Promise<Category | null> {
    return this.adapter.getCategoryBySlug(slug);
  }

  override async getSubcategories(parentId: string | null): Promise<Category[]> {
    const categories = await this.adapter.getCategories();
    return categories.filter(cat => cat.parentId === parentId);
  }

  override async getCategoryPath(categoryId: string): Promise<Category[]> {
    const category = await this.adapter.getCategoryById(categoryId);
    if (!category) return [];

    const path: Category[] = [];
    const categories = await this.adapter.getCategories();

    // Reconstruir el path desde la categoría hasta la raíz
    let current = category;
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = categories.find(c => c.id === current.parentId) || null!;
      } else {
        break;
      }
    }

    return path;
  }

  // ==================== ANALYTICS ====================

  override async trackProductView(productId: string, userId?: string): Promise<void> {
    return this.adapter.trackProductView(productId, userId);
  }

  override async trackProductClick(productId: string, userId?: string): Promise<void> {
    return this.adapter.trackProductClick(productId, userId);
  }

  override async trackProductTimeOnPage(
    productId: string,
    timeInSeconds: number,
    userId?: string
  ): Promise<void> {
    return this.adapter.trackProductTimeOnPage(productId, timeInSeconds, userId);
  }

  override async getMostViewedProducts(limit = 10): Promise<Product[]> {
    return this.adapter.getMostViewedProducts(limit);
  }

  // ==================== FILTERS ====================

  override async getAvailableFilterValues(categoryId?: string): Promise<{
    brands: string[];
    sizes: string[];
    colors: string[];
    priceRange: { min: number; max: number };
    maxRating: number;
  }> {
    // Obtener todos los productos (o de una categoría específica)
    const params: GetProductsParams = {
      filter: categoryId ? { categoryIds: [categoryId] } : {},
      page: 1,
      pageSize: 1000, // Obtener muchos para calcular disponibles
    };

    const result = await this.adapter.getProducts(params);
    const products = result.products;

    // Extraer valores únicos
    const brands = new Set<string>();
    const sizes = new Set<string>();
    const colors = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let maxRating = 0;

    products.forEach(product => {
      brands.add(product.brand);
      
      product.variants.forEach(variant => {
        if (variant.size) sizes.add(variant.size);
        if (variant.color) colors.add(variant.color);
      });

      minPrice = Math.min(minPrice, product.minPrice);
      maxPrice = Math.max(maxPrice, product.maxPrice);
      maxRating = Math.max(maxRating, product.rating.average);
    });

    return {
      brands: Array.from(brands).sort(),
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice },
      maxRating,
    };
  }

  override async getProductCountsByFilter(
    filter: ProductFilter
  ): Promise<Record<string, number>> {
    // Obtener productos con el filtro actual
    const result = await this.adapter.getProducts({ filter });
    const products = result.products;

    const counts: Record<string, number> = {};

    // Contar por categoría
    products.forEach(product => {
      const key = `category_${product.categoryId}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    // Contar por marca
    products.forEach(product => {
      const key = `brand_${product.brand}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }
}
