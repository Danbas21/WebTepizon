/**
 * Local Cart Adapter
 * 
 * Implementación del adaptador para localStorage.
 * Maneja la persistencia del carrito para usuarios guest (no autenticados).
 * 
 * @pattern Adapter (Hexagonal Architecture)
 * @infrastructure localStorage
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, createCart } from '../../domain/models/cart.model';
import { CartItem } from '../../domain/models/cart-item.model';
import { Coupon } from '../../domain/models/coupon.model';

/**
 * Adapter de localStorage para carrito
 * 
 * Responsabilidades:
 * - Persistir carrito en localStorage
 * - Notificar cambios mediante Observable
 * - Manejar serialización/deserialización
 */
@Injectable({
  providedIn: 'root',
})
export class LocalCartAdapter {
  private readonly STORAGE_KEY = 'tepizon_cart';
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);

  constructor() {
    // Cargar carrito inicial si existe
    this.loadCart();
  }

  // ==================== CART OPERATIONS ====================

  /**
   * Obtiene el carrito desde localStorage
   */
  getCart(): Cart {
    const cartData = localStorage.getItem(this.STORAGE_KEY);

    if (!cartData) {
      const newCart = createCart({ userId: null });
      this.saveCart(newCart);
      return newCart;
    }

    try {
      const parsed = JSON.parse(cartData);
      return this.deserializeCart(parsed);
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
      const newCart = createCart({ userId: null });
      this.saveCart(newCart);
      return newCart;
    }
  }

  /**
   * Guarda el carrito en localStorage
   */
  saveCart(cart: Cart): void {
    try {
      const serialized = this.serializeCart(cart);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
      this.cartSubject.next(cart);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      throw new Error('No se pudo guardar el carrito');
    }
  }

  /**
   * Observable del carrito
   */
  watchCart(): Observable<Cart | null> {
    return this.cartSubject.asObservable();
  }

  /**
   * Elimina el carrito de localStorage
   */
  deleteCart(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.cartSubject.next(null);
  }

  /**
   * Verifica si existe un carrito en localStorage
   */
  hasCart(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // ==================== SERIALIZATION ====================

  /**
   * Serializa el carrito para localStorage
   */
  private serializeCart(cart: Cart): any {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map(item => this.serializeCartItem(item)),
      appliedCoupon: cart.appliedCoupon ? this.serializeCoupon(cart.appliedCoupon) : null,
      totals: cart.totals,
      status: cart.status,
      isEmpty: cart.isEmpty,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
      lastActivityAt: cart.lastActivityAt.toISOString(),
      expiresAt: cart.expiresAt.toISOString(),
      source: cart.source,
      sessionId: cart.sessionId,
    };
  }

  /**
   * Deserializa el carrito desde localStorage
   */
  private deserializeCart(data: any): Cart {
    return createCart({
      id: data.id,
      userId: data.userId,
      items: data.items.map((item: any) => this.deserializeCartItem(item)),
      appliedCoupon: data.appliedCoupon
        ? this.deserializeCoupon(data.appliedCoupon)
        : null,
      totals: data.totals,
      status: data.status,
      isEmpty: data.isEmpty,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastActivityAt: new Date(data.lastActivityAt),
      expiresAt: new Date(data.expiresAt),
      source: data.source,
      sessionId: data.sessionId,
    });
  }

  /**
   * Serializa un cart item
   */
  private serializeCartItem(item: CartItem): any {
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productSnapshot: item.productSnapshot,
      variantSnapshot: item.variantSnapshot,
      quantity: item.quantity,
      maxQuantity: item.maxQuantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: item.discount,
      total: item.total,
      addedAt: item.addedAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      isAvailable: item.isAvailable,
      hasStockIssue: item.hasStockIssue,
      stockMessage: item.stockMessage,
    };
  }

  /**
   * Deserializa un cart item
   */
  private deserializeCartItem(data: any): CartItem {
    return {
      id: data.id,
      productId: data.productId,
      variantId: data.variantId,
      productSnapshot: data.productSnapshot,
      variantSnapshot: data.variantSnapshot,
      quantity: data.quantity,
      maxQuantity: data.maxQuantity,
      unitPrice: data.unitPrice,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      addedAt: new Date(data.addedAt),
      updatedAt: new Date(data.updatedAt),
      isAvailable: data.isAvailable,
      hasStockIssue: data.hasStockIssue,
      stockMessage: data.stockMessage,
    };
  }

  /**
   * Serializa un cupón
   */
  private serializeCoupon(coupon: Coupon): any {
    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      status: coupon.status,
      isActive: coupon.isActive,
      restrictions: coupon.restrictions,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      maxUsesPerUser: coupon.maxUsesPerUser,
      validFrom: coupon.validFrom.toISOString(),
      validUntil: coupon.validUntil.toISOString(),
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
    };
  }

  /**
   * Deserializa un cupón
   */
  private deserializeCoupon(data: any): Coupon {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      status: data.status,
      isActive: data.isActive,
      restrictions: data.restrictions,
      maxUses: data.maxUses,
      usedCount: data.usedCount,
      maxUsesPerUser: data.maxUsesPerUser,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  // ==================== UTILITY ====================

  /**
   * Carga el carrito inicial
   */
  private loadCart(): void {
    const cart = this.getCart();
    this.cartSubject.next(cart);
  }

  /**
   * Obtiene el tamaño del carrito en localStorage (en bytes)
   */
  getStorageSize(): number {
    const cartData = localStorage.getItem(this.STORAGE_KEY);
    return cartData ? new Blob([cartData]).size : 0;
  }

  /**
   * Limpia localStorage si está lleno
   */
  clearIfFull(): boolean {
    try {
      // Intentar escribir algo pequeño
      const testKey = '_test_key_';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      // localStorage está lleno
      console.warn('localStorage is full, clearing cart');
      this.deleteCart();
      return true;
    }
  }
}
