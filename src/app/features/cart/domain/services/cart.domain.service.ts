/**
 * Cart Domain Service
 * 
 * Contiene la lógica de negocio relacionada con el carrito.
 * Incluye validaciones, cálculos, reglas de negocio, etc.
 * 
 * @domain Cart
 * @pattern Domain Service
 */

import { Injectable } from '@angular/core';
import {
  Cart,
  CartItem,
  Coupon,
  isCartAbandoned,
  isCartExpired,
  hasStockIssues,
  getTotalSavings,
  getSavingsPercentage,
  qualifiesForFreeShipping,
  amountUntilFreeShipping,
} from '../models/cart.model';
import { canAddToCart, formatItemName } from '../models/cart-item.model';
import {
  isCouponValid,
  getCouponValidationError,
  formatCouponValue,
  normalizeCouponCode,
} from '../models/coupon.model';

@Injectable({
  providedIn: 'root',
})
export class CartDomainService {
  // Configuración
  private readonly FREE_SHIPPING_THRESHOLD = 500; // MXN
  private readonly MAX_ITEMS_PER_CART = 50;
  private readonly MAX_QUANTITY_PER_ITEM = 99;
  private readonly TAX_RATE = 0.16; // 16% IVA México

  // ==================== CART VALIDATION ====================

  /**
   * Valida que el carrito esté en buen estado
   */
  validateCart(cart: Cart): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (cart.isEmpty) {
      errors.push('El carrito está vacío');
    }

    if (isCartExpired(cart)) {
      errors.push('El carrito ha expirado');
    }

    if (hasStockIssues(cart)) {
      errors.push('Algunos productos no tienen stock disponible');
    }

    if (cart.items.length > this.MAX_ITEMS_PER_CART) {
      errors.push(`El carrito no puede tener más de ${this.MAX_ITEMS_PER_CART} items`);
    }

    // Validar cada item
    cart.items.forEach(item => {
      const itemValidation = this.validateCartItem(item);
      if (!itemValidation.isValid) {
        errors.push(...itemValidation.errors.map(e => `${formatItemName(item)}: ${e}`));
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida un item del carrito
   */
  validateCartItem(item: CartItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.isAvailable) {
      errors.push('Producto no disponible');
    }

    if (item.hasStockIssue) {
      errors.push(item.stockMessage || 'Problema de stock');
    }

    if (item.quantity < 1) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (item.quantity > item.maxQuantity) {
      errors.push(`La cantidad máxima es ${item.maxQuantity}`);
    }

    if (item.quantity > this.MAX_QUANTITY_PER_ITEM) {
      errors.push(`No puedes agregar más de ${this.MAX_QUANTITY_PER_ITEM} unidades`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida si se puede agregar un item al carrito
   */
  canAddItem(cart: Cart, quantity: number, maxQuantity: number): {
    canAdd: boolean;
    reason?: string;
  } {
    // Validar que el carrito no esté lleno
    if (cart.items.length >= this.MAX_ITEMS_PER_CART) {
      return {
        canAdd: false,
        reason: `Has alcanzado el límite de ${this.MAX_ITEMS_PER_CART} productos en el carrito`,
      };
    }

    // Validar cantidad
    if (!canAddToCart(quantity, maxQuantity)) {
      return {
        canAdd: false,
        reason: `La cantidad debe estar entre 1 y ${maxQuantity}`,
      };
    }

    return { canAdd: true };
  }

  // ==================== COUPON VALIDATION ====================

  /**
   * Valida un cupón para el carrito
   */
  validateCouponForCart(
    coupon: Coupon,
    cart: Cart,
    userId?: string
  ): { isValid: boolean; error?: string } {
    // Validar que el cupón esté activo
    if (!isCouponValid(coupon)) {
      const error = getCouponValidationError(coupon, cart.totals.subtotal, userId);
      return {
        isValid: false,
        error: error || 'Cupón no válido',
      };
    }

    // Validar monto mínimo
    const error = getCouponValidationError(coupon, cart.totals.subtotal, userId);
    if (error) {
      return {
        isValid: false,
        error,
      };
    }

    return { isValid: true };
  }

  // ==================== CALCULATIONS ====================

  /**
   * Calcula si el carrito califica para envío gratis
   */
  checkFreeShipping(cart: Cart): {
    qualifies: boolean;
    threshold: number;
    amountNeeded: number;
  } {
    return {
      qualifies: qualifiesForFreeShipping(cart, this.FREE_SHIPPING_THRESHOLD),
      threshold: this.FREE_SHIPPING_THRESHOLD,
      amountNeeded: amountUntilFreeShipping(cart, this.FREE_SHIPPING_THRESHOLD),
    };
  }

  /**
   * Formatea el mensaje de envío gratis
   */
  getFreeShippingMessage(cart: Cart): string {
    const freeShipping = this.checkFreeShipping(cart);

    if (freeShipping.qualifies) {
      return '¡Envío gratis!';
    }

    return `Agrega $${freeShipping.amountNeeded.toFixed(2)} más para envío gratis`;
  }

  /**
   * Calcula el ahorro total
   */
  calculateSavings(cart: Cart): {
    amount: number;
    percentage: number;
    formatted: string;
  } {
    const amount = getTotalSavings(cart);
    const percentage = getSavingsPercentage(cart);

    return {
      amount,
      percentage,
      formatted: `Ahorras $${amount.toFixed(2)} (${percentage}%)`,
    };
  }

  /**
   * Obtiene un resumen del carrito
   */
  getCartSummary(cart: Cart): {
    itemsCount: number;
    itemsText: string;
    subtotal: string;
    discount: string;
    tax: string;
    shipping: string;
    total: string;
    hasCoupon: boolean;
    hasDiscount: boolean;
    freeShipping: boolean;
  } {
    const freeShipping = this.checkFreeShipping(cart);

    return {
      itemsCount: cart.totals.itemsCount,
      itemsText: cart.totals.itemsCount === 1
        ? '1 producto'
        : `${cart.totals.itemsCount} productos`,
      subtotal: this.formatPrice(cart.totals.subtotal),
      discount: this.formatPrice(cart.totals.totalDiscount),
      tax: this.formatPrice(cart.totals.tax),
      shipping: cart.totals.shippingCost === 0
        ? 'Gratis'
        : this.formatPrice(cart.totals.shippingCost),
      total: this.formatPrice(cart.totals.total),
      hasCoupon: cart.appliedCoupon !== null,
      hasDiscount: cart.totals.totalDiscount > 0,
      freeShipping: freeShipping.qualifies,
    };
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Obtiene el mensaje de stock de un item
   */
  getStockMessage(item: CartItem): string {
    if (!item.isAvailable) {
      return 'No disponible';
    }

    if (item.hasStockIssue) {
      return item.stockMessage || 'Stock limitado';
    }

    if (item.maxQuantity < 5) {
      return `Solo ${item.maxQuantity} disponibles`;
    }

    return 'En stock';
  }

  /**
   * Verifica si un item tiene bajo stock
   */
  hasLowStock(item: CartItem): boolean {
    return item.maxQuantity < 5 && item.isAvailable;
  }

  // ==================== ABANDONED CART ====================

  /**
   * Verifica si el carrito debe ser marcado como abandonado
   */
  shouldMarkAsAbandoned(cart: Cart): boolean {
    return isCartAbandoned(cart) && !cart.isEmpty;
  }

  /**
   * Obtiene el tiempo desde la última actividad
   */
  getTimeSinceLastActivity(cart: Cart): {
    hours: number;
    minutes: number;
    formatted: string;
  } {
    const now = new Date();
    const diff = now.getTime() - cart.lastActivityAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h`;
      if (minutes > 0) {
        formatted += ` ${minutes}m`;
      }
    } else {
      formatted = `${minutes}m`;
    }

    return { hours, minutes, formatted };
  }

  // ==================== FORMATTING ====================

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
   * Formatea la cantidad de items
   */
  formatItemsCount(count: number): string {
    return count === 1 ? '1 item' : `${count} items`;
  }

  /**
   * Formatea la información de un cupón
   */
  formatCoupon(coupon: Coupon): string {
    return `${coupon.code}: ${formatCouponValue(coupon)}`;
  }

  // ==================== COMPARISONS ====================

  /**
   * Compara dos carritos para detectar cambios
   */
  hasCartChanged(oldCart: Cart, newCart: Cart): boolean {
    // Comparar número de items
    if (oldCart.items.length !== newCart.items.length) {
      return true;
    }

    // Comparar items
    for (let i = 0; i < oldCart.items.length; i++) {
      const oldItem = oldCart.items[i];
      const newItem = newCart.items.find(
        item => item.productId === oldItem.productId && item.variantId === oldItem.variantId
      );

      if (!newItem || oldItem.quantity !== newItem.quantity) {
        return true;
      }
    }

    // Comparar cupón
    if (
      (oldCart.appliedCoupon?.code || null) !==
      (newCart.appliedCoupon?.code || null)
    ) {
      return true;
    }

    return false;
  }

  // ==================== RECOMMENDATIONS ====================

  /**
   * Sugiere cantidad óptima basada en descuentos
   */
  suggestOptimalQuantity(
    unitPrice: number,
    compareAtPrice: number | undefined,
    maxQuantity: number
  ): { quantity: number; reason: string } | null {
    // Si hay descuento, sugerir comprar más
    if (compareAtPrice && compareAtPrice > unitPrice) {
      const discountPercent = Math.round(
        ((compareAtPrice - unitPrice) / compareAtPrice) * 100
      );

      if (discountPercent >= 20 && maxQuantity >= 2) {
        return {
          quantity: Math.min(2, maxQuantity),
          reason: `¡${discountPercent}% de descuento! Considera llevar más`,
        };
      }
    }

    return null;
  }

  /**
   * Obtiene recomendaciones para el carrito
   */
  getCartRecommendations(cart: Cart): string[] {
    const recommendations: string[] = [];

    // Envío gratis
    const freeShipping = this.checkFreeShipping(cart);
    if (!freeShipping.qualifies && freeShipping.amountNeeded <= 200) {
      recommendations.push(this.getFreeShippingMessage(cart));
    }

    // Cupón no aplicado
    if (!cart.appliedCoupon && cart.totals.subtotal > 300) {
      recommendations.push('¿Tienes un cupón de descuento?');
    }

    // Items con bajo stock
    const lowStockItems = cart.items.filter(item => this.hasLowStock(item));
    if (lowStockItems.length > 0) {
      recommendations.push(
        `${lowStockItems.length} ${
          lowStockItems.length === 1 ? 'producto tiene' : 'productos tienen'
        } stock limitado`
      );
    }

    return recommendations;
  }

  // ==================== BUSINESS RULES ====================

  /**
   * Obtiene la tasa de impuesto configurada
   */
  getTaxRate(): number {
    return this.TAX_RATE;
  }

  /**
   * Obtiene el límite de items por carrito
   */
  getMaxItemsPerCart(): number {
    return this.MAX_ITEMS_PER_CART;
  }

  /**
   * Obtiene la cantidad máxima por item
   */
  getMaxQuantityPerItem(): number {
    return this.MAX_QUANTITY_PER_ITEM;
  }

  /**
   * Obtiene el umbral de envío gratis
   */
  getFreeShippingThreshold(): number {
    return this.FREE_SHIPPING_THRESHOLD;
  }
}
