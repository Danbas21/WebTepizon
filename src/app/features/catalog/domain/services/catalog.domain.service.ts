/**
 * Catalog Domain Service
 * 
 * Contiene la lógica de negocio relacionada con productos y categorías.
 * Incluye validaciones, cálculos de precios, gestión de stock, etc.
 * 
 * @domain Catalog
 * @pattern Domain Service
 */

import { Injectable } from '@angular/core';
import {
  Product,
  ProductVariant,
  isProductAvailable,
  calculateTotalStock,
  calculatePriceRange,
  hasProductDiscount,
  calculateDiscountPercentage,
} from '../models/product.model';
import { Category, isRootCategory } from '../models/category.model';
import {
  ProductFilter,
  ProductSort,
  ProductSortOption,
  isValidPriceRange,
  isValidRating,
} from '../models/product-filter.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogDomainService {
  // ==================== PRODUCT VALIDATION ====================

  /**
   * Valida que un producto tenga todos los datos requeridos
   */
  validateProduct(product: Product): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.name || product.name.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!product.description || product.description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    if (!product.brand || product.brand.trim().length < 2) {
      errors.push('La marca debe tener al menos 2 caracteres');
    }

    if (!product.categoryId) {
      errors.push('El producto debe tener una categoría');
    }

    if (!product.variants.length) {
      errors.push('El producto debe tener al menos una variante');
    }

    if (!product.images.length) {
      errors.push('El producto debe tener al menos una imagen');
    }

    if (product.basePrice <= 0) {
      errors.push('El precio base debe ser mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida una variante de producto
   */
  validateVariant(variant: ProductVariant): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!variant.sku || variant.sku.trim().length < 3) {
      errors.push('El SKU debe tener al menos 3 caracteres');
    }

    if (variant.price <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }

    if (variant.stock < 0) {
      errors.push('El stock no puede ser negativo');
    }

    if (variant.compareAtPrice && variant.compareAtPrice <= variant.price) {
      errors.push('El precio de comparación debe ser mayor al precio actual');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== PRICE CALCULATIONS ====================

  /**
   * Calcula el precio final de una variante con descuento
   */
  calculateFinalPrice(variant: ProductVariant): number {
    return variant.price;
  }

  /**
   * Calcula el ahorro en una variante con descuento
   */
  calculateSavings(variant: ProductVariant): number {
    if (!variant.compareAtPrice) return 0;
    return variant.compareAtPrice - variant.price;
  }

  /**
   * Calcula el porcentaje de descuento de una variante
   */
  calculateVariantDiscount(variant: ProductVariant): number {
    if (!variant.compareAtPrice || variant.compareAtPrice <= variant.price) {
      return 0;
    }
    return Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100);
  }

  /**
   * Formatea un precio para display
   */
  formatPrice(price: number, currency = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(price);
  }

  /**
   * Formatea un rango de precios
   */
  formatPriceRange(min: number, max: number, currency = 'MXN'): string {
    if (min === max) {
      return this.formatPrice(min, currency);
    }
    return `${this.formatPrice(min, currency)} - ${this.formatPrice(max, currency)}`;
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Verifica si un producto está en stock bajo (< 5 unidades)
   */
  isLowStock(product: Product): boolean {
    return product.totalStock > 0 && product.totalStock < 5;
  }

  /**
   * Verifica si hay suficiente stock para una cantidad
   */
  hasEnoughStock(product: Product, variantId: string, quantity: number): boolean {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return false;
    return variant.stock >= quantity;
  }

  /**
   * Obtiene el mensaje de stock apropiado
   */
  getStockMessage(product: Product, variantId?: string): string {
    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) return 'Variante no encontrada';
      
      if (variant.stock === 0) return 'Agotado';
      if (variant.stock < 5) return `Solo quedan ${variant.stock} unidades`;
      return 'En stock';
    }

    if (product.totalStock === 0) return 'Agotado';
    if (product.totalStock < 5) return `Solo quedan ${product.totalStock} unidades`;
    return 'En stock';
  }

  /**
   * Calcula el nivel de stock como porcentaje
   */
  getStockLevel(currentStock: number, maxStock: number): number {
    if (maxStock === 0) return 0;
    return Math.min(Math.round((currentStock / maxStock) * 100), 100);
  }

  // ==================== FILTERING & SORTING ====================

  /**
   * Valida un filtro de productos
   */
  validateFilter(filter: ProductFilter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filter.priceRange && !isValidPriceRange(filter.priceRange)) {
      errors.push('El rango de precio no es válido');
    }

    if (filter.minRating !== undefined && !isValidRating(filter.minRating)) {
      errors.push('El rating debe estar entre 0 y 5');
    }

    if (filter.searchQuery && filter.searchQuery.trim().length < 2) {
      errors.push('La búsqueda debe tener al menos 2 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Aplica filtros a una lista de productos (client-side)
   * Útil para filtrado local
   */
  filterProducts(products: Product[], filter: ProductFilter): Product[] {
    let filtered = [...products];

    // Búsqueda por texto
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
      );
    }

    // Filtro de precio
    if (filter.priceRange) {
      filtered = filtered.filter(
        p => p.minPrice >= filter.priceRange!.min && p.maxPrice <= filter.priceRange!.max
      );
    }

    // Filtro de categoría
    if (filter.categoryIds?.length) {
      filtered = filtered.filter(p => filter.categoryIds!.includes(p.categoryId));
    }

    // Filtro de marca
    if (filter.brands?.length) {
      filtered = filtered.filter(p => filter.brands!.includes(p.brand));
    }

    // Filtro de tallas
    if (filter.sizes?.length) {
      filtered = filtered.filter(p =>
        p.variants.some(v => v.size && filter.sizes!.includes(v.size))
      );
    }

    // Filtro de colores
    if (filter.colors?.length) {
      filtered = filtered.filter(p =>
        p.variants.some(v => v.color && filter.colors!.includes(v.color))
      );
    }

    // Filtro de rating
    if (filter.minRating) {
      filtered = filtered.filter(p => p.rating.average >= filter.minRating!);
    }

    // Filtro de stock
    if (filter.inStock) {
      filtered = filtered.filter(p => !p.isOutOfStock);
    }

    // Filtro de descuento
    if (filter.onSale) {
      filtered = filtered.filter(p => p.hasDiscount);
    }

    // Filtros adicionales
    if (filter.isFeatured) {
      filtered = filtered.filter(p => p.isFeatured);
    }

    if (filter.isNew) {
      filtered = filtered.filter(p => p.isNew);
    }

    return filtered;
  }

  /**
   * Ordena una lista de productos (client-side)
   */
  sortProducts(products: Product[], sort: ProductSort): Product[] {
    const sorted = [...products];

    switch (sort.option) {
      case ProductSortOption.NEWEST:
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;

      case ProductSortOption.PRICE_LOW_HIGH:
        sorted.sort((a, b) => a.minPrice - b.minPrice);
        break;

      case ProductSortOption.PRICE_HIGH_LOW:
        sorted.sort((a, b) => b.maxPrice - a.maxPrice);
        break;

      case ProductSortOption.MOST_SOLD:
        sorted.sort((a, b) => b.analytics.purchases - a.analytics.purchases);
        break;

      case ProductSortOption.BEST_RATED:
        sorted.sort((a, b) => {
          if (b.rating.average === a.rating.average) {
            return b.rating.count - a.rating.count;
          }
          return b.rating.average - a.rating.average;
        });
        break;

      case ProductSortOption.ALPHABETICAL:
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
    }

    return sort.direction === 'desc' ? sorted.reverse() : sorted;
  }

  // ==================== CATEGORY VALIDATION ====================

  /**
   * Valida una categoría
   */
  validateCategory(category: Category): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!category.name || category.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (category.level < 0 || category.level > 3) {
      errors.push('El nivel debe estar entre 0 y 3');
    }

    if (category.order < 0) {
      errors.push('El orden no puede ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== SEARCH & RECOMMENDATIONS ====================

  /**
   * Calcula relevancia de búsqueda (0-100)
   */
  calculateSearchRelevance(product: Product, query: string): number {
    const q = query.toLowerCase();
    let score = 0;

    // Coincidencia exacta en nombre (peso 40)
    if (product.name.toLowerCase() === q) {
      score += 40;
    } else if (product.name.toLowerCase().includes(q)) {
      score += 20;
    }

    // Coincidencia en marca (peso 20)
    if (product.brand.toLowerCase().includes(q)) {
      score += 20;
    }

    // Coincidencia en descripción (peso 10)
    if (product.description.toLowerCase().includes(q)) {
      score += 10;
    }

    // Coincidencia en tags (peso 10)
    if (product.tags.some(tag => tag.toLowerCase().includes(q))) {
      score += 10;
    }

    // Bonificación por rating (peso 10)
    score += product.rating.average * 2;

    // Bonificación por disponibilidad (peso 10)
    if (!product.isOutOfStock) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Genera slug para SEO
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-'); // Múltiples guiones a uno
  }

  /**
   * Genera sugerencias de búsqueda
   */
  generateSearchSuggestions(products: Product[], query: string, limit = 5): string[] {
    const suggestions = new Set<string>();
    const q = query.toLowerCase();

    products.forEach(product => {
      if (product.name.toLowerCase().includes(q)) {
        suggestions.add(product.name);
      }
      if (product.brand.toLowerCase().includes(q)) {
        suggestions.add(product.brand);
      }
      product.tags.forEach(tag => {
        if (tag.toLowerCase().includes(q)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }
}
