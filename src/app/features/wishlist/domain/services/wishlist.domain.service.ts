/**
 * Servicio de Dominio: WishlistDomainService
 * Contiene la lógica de negocio pura de Wishlist
 */

import { 
  Wishlist, 
  WishlistError, 
  WishlistErrorCode,
  WishlistSummary 
} from './wishlist.model';
import { WishlistItem, CreateWishlistItemDto } from './wishlist-item.model';

export class WishlistDomainService {
  private static readonly MAX_WISHLIST_ITEMS = 100;
  private static readonly PRICE_DROP_THRESHOLD_DEFAULT = 10; // 10% default

  /**
   * Valida si se puede agregar un item a la wishlist
   */
  static validateAddItem(
    wishlist: Wishlist, 
    productId: string, 
    variantId?: string
  ): void {
    // Verificar límite de items
    if (wishlist.items.length >= this.MAX_WISHLIST_ITEMS) {
      throw new WishlistError(
        `La lista de deseos no puede tener más de ${this.MAX_WISHLIST_ITEMS} productos`,
        WishlistErrorCode.WISHLIST_FULL
      );
    }

    // Verificar si el item ya existe
    const exists = this.isItemInWishlist(wishlist, productId, variantId);
    if (exists) {
      throw new WishlistError(
        'Este producto ya está en tu lista de deseos',
        WishlistErrorCode.ITEM_ALREADY_EXISTS
      );
    }
  }

  /**
   * Verifica si un producto/variante está en la wishlist
   */
  static isItemInWishlist(
    wishlist: Wishlist, 
    productId: string, 
    variantId?: string
  ): boolean {
    return wishlist.items.some(item => {
      if (variantId) {
        return item.productId === productId && item.variantId === variantId;
      }
      return item.productId === productId;
    });
  }

  /**
   * Calcula las estadísticas de la wishlist
   */
  static calculateStats(items: readonly WishlistItem[]): Wishlist['stats'] {
    const stats = {
      totalItems: items.length,
      itemsWithPriceDrops: 0,
      itemsOutOfStock: 0,
      totalSavings: 0,
      averagePriceChange: 0
    };

    if (items.length === 0) {
      return stats;
    }

    let totalPriceChange = 0;

    items.forEach(item => {
      // Contar items con bajada de precio
      if (item.hasPriceDropped) {
        stats.itemsWithPriceDrops++;
        stats.totalSavings += (item.originalPrice - item.currentPrice);
      }

      // Contar items sin stock
      if (!item.isInStock) {
        stats.itemsOutOfStock++;
      }

      // Acumular cambio de precio
      totalPriceChange += item.priceChange;
    });

    // Calcular promedio de cambio de precio
    stats.averagePriceChange = totalPriceChange / items.length;

    return stats;
  }

  /**
   * Genera un resumen de la wishlist
   */
  static generateSummary(wishlist: Wishlist): WishlistSummary {
    return {
      totalItems: wishlist.stats.totalItems,
      itemsWithPriceDrops: wishlist.stats.itemsWithPriceDrops,
      itemsOutOfStock: wishlist.stats.itemsOutOfStock,
      totalSavings: wishlist.stats.totalSavings,
      hasUnreadAlerts: wishlist.stats.itemsWithPriceDrops > 0 || 
                       wishlist.stats.itemsOutOfStock > 0
    };
  }

  /**
   * Determina si un item debe generar una alerta de precio
   */
  static shouldAlertPriceDrop(item: WishlistItem): boolean {
    if (!item.priceAlertEnabled) {
      return false;
    }

    const priceDropPercentage = ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100;
    const threshold = item.priceAlertThreshold || this.PRICE_DROP_THRESHOLD_DEFAULT;

    return priceDropPercentage >= threshold;
  }

  /**
   * Determina si un item debe generar una alerta de stock
   */
  static shouldAlertStockChange(
    item: WishlistItem, 
    previousStock: number
  ): boolean {
    if (!item.stockAlertEnabled) {
      return false;
    }

    // Alerta si pasó de sin stock a con stock
    return previousStock === 0 && item.stockQuantity > 0;
  }

  /**
   * Calcula el cambio de precio
   */
  static calculatePriceChange(
    originalPrice: number, 
    currentPrice: number
  ): number {
    return ((currentPrice - originalPrice) / originalPrice) * 100;
  }

  /**
   * Valida los datos para crear un item
   */
  static validateCreateItemDto(dto: CreateWishlistItemDto): void {
    if (!dto.productId || dto.productId.trim() === '') {
      throw new WishlistError(
        'El ID del producto es requerido',
        WishlistErrorCode.PRODUCT_NOT_AVAILABLE
      );
    }

    if (!dto.productSnapshot || !dto.productSnapshot.name) {
      throw new WishlistError(
        'La información del producto es inválida',
        WishlistErrorCode.PRODUCT_NOT_AVAILABLE
      );
    }

    if (dto.currentPrice <= 0) {
      throw new WishlistError(
        'El precio del producto es inválido',
        WishlistErrorCode.PRODUCT_NOT_AVAILABLE
      );
    }

    if (dto.priceAlertThreshold && (dto.priceAlertThreshold < 0 || dto.priceAlertThreshold > 100)) {
      throw new WishlistError(
        'El umbral de alerta debe estar entre 0 y 100',
        WishlistErrorCode.PRODUCT_NOT_AVAILABLE
      );
    }
  }

  /**
   * Ordena los items de la wishlist por prioridad y fecha
   */
  static sortItems(items: WishlistItem[]): WishlistItem[] {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    return [...items].sort((a, b) => {
      // Primero por prioridad
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por fecha (más recientes primero)
      return b.addedAt.getTime() - a.addedAt.getTime();
    });
  }

  /**
   * Filtra items por disponibilidad
   */
  static filterByAvailability(
    items: WishlistItem[], 
    showOnlyAvailable: boolean
  ): WishlistItem[] {
    if (!showOnlyAvailable) return items;
    return items.filter(item => item.isAvailable && item.isInStock);
  }

  /**
   * Filtra items con bajadas de precio
   */
  static filterByPriceDrops(items: WishlistItem[]): WishlistItem[] {
    return items.filter(item => item.hasPriceDropped);
  }
}
