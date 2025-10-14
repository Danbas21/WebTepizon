/**
 * Cart Repository Implementation
 * 
 * Implementación concreta del puerto CartRepositoryPort.
 * Combina LocalCartAdapter (guests) y FirebaseCartAdapter (usuarios autenticados).
 * 
 * @pattern Repository (Hexagonal Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';

import { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import {
  Cart,
  CartItem,
  Coupon,
  createCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  applyCouponToCart,
  removeCouponFromCart,
  clearCart,
  mergeCarts,
  updateShippingCost,
} from '../../domain/models/cart.model';

import { FirebaseCartAdapter } from '../adapters/firebase-cart.adapter';
import { LocalCartAdapter } from '../adapters/local-cart.adapter';

/**
 * Implementación del repositorio de carrito
 * 
 * Estrategia:
 * - Guest users → localStorage (LocalCartAdapter)
 * - Authenticated users → Firestore (FirebaseCartAdapter)
 * - Al hacer login → merge de carritos
 */
@Injectable({
  providedIn: 'root',
})
export class CartRepositoryImpl extends CartRepositoryPort {
  private readonly firebaseAdapter = inject(FirebaseCartAdapter);
  private readonly localAdapter = inject(LocalCartAdapter);

  // ==================== CART OPERATIONS ====================

  override async getCart(userId: string | null): Promise<Cart> {
    if (userId) {
      // Usuario autenticado → Firestore
      const cart = await this.firebaseAdapter.getCart(userId);
      return cart || createCart({ userId });
    } else {
      // Guest → localStorage
      return this.localAdapter.getCart();
    }
  }

  override async saveCart(cart: Cart): Promise<Cart> {
    if (cart.userId) {
      // Usuario autenticado → Firestore
      await this.firebaseAdapter.saveCart(cart);
      return cart;
    } else {
      // Guest → localStorage
      this.localAdapter.saveCart(cart);
      return cart;
    }
  }

  override watchCart(userId: string | null): Observable<Cart> {
    if (userId) {
      // Usuario autenticado → Firestore listener
      return this.firebaseAdapter.watchCart(userId).pipe(
        switchMap(cart => of(cart || createCart({ userId })))
      );
    } else {
      // Guest → localStorage observer
      return this.localAdapter.watchCart().pipe(
        switchMap(cart => of(cart || createCart({ userId: null })))
      );
    }
  }

  override async deleteCart(userId: string | null): Promise<void> {
    if (userId) {
      await this.firebaseAdapter.deleteCart(userId);
    } else {
      this.localAdapter.deleteCart();
    }
  }

  // ==================== ITEM OPERATIONS ====================

  override async addItem(userId: string | null, item: CartItem): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = addItemToCart(cart, item);
    return await this.saveCart(updatedCart);
  }

  override async removeItem(userId: string | null, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = removeItemFromCart(cart, itemId);
    return await this.saveCart(updatedCart);
  }

  override async updateItemQuantity(
    userId: string | null,
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = updateItemQuantity(cart, itemId, quantity);
    return await this.saveCart(updatedCart);
  }

  override async clearItems(userId: string | null): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = clearCart(cart);
    return await this.saveCart(updatedCart);
  }

  // ==================== COUPON OPERATIONS ====================

  override async applyCoupon(
    userId: string | null,
    couponCode: string
  ): Promise<{ cart: Cart; coupon: Coupon }> {
    // Buscar el cupón
    const coupon = await this.firebaseAdapter.getCouponByCode(couponCode);

    if (!coupon) {
      throw new Error('Cupón no encontrado');
    }

    // Obtener carrito y aplicar cupón
    const cart = await this.getCart(userId);
    const updatedCart = applyCouponToCart(cart, coupon);

    // Guardar carrito
    await this.saveCart(updatedCart);

    // Incrementar uso del cupón
    if (userId) {
      await this.firebaseAdapter.incrementCouponUsage(coupon.id);
    }

    return { cart: updatedCart, coupon };
  }

  override async removeCoupon(userId: string | null): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = removeCouponFromCart(cart);
    return await this.saveCart(updatedCart);
  }

  override async validateCoupon(
    couponCode: string,
    userId?: string,
    subtotal?: number
  ): Promise<Coupon | null> {
    return await this.firebaseAdapter.getCouponByCode(couponCode);
  }

  override async getCouponByCode(code: string): Promise<Coupon | null> {
    return await this.firebaseAdapter.getCouponByCode(code);
  }

  // ==================== SYNC OPERATIONS ====================

  override async syncCarts(
    localUserId: string | null,
    remoteUserId: string
  ): Promise<Cart> {
    // Obtener ambos carritos
    const localCart = await this.getCart(localUserId);
    const remoteCart = await this.getCart(remoteUserId);

    // Hacer merge
    const mergedCart = mergeCarts(localCart, remoteCart);

    // Asignar al usuario autenticado
    mergedCart.userId = remoteUserId;

    // Guardar en Firestore
    await this.firebaseAdapter.saveCart(mergedCart);

    // Limpiar localStorage
    this.localAdapter.deleteCart();

    return mergedCart;
  }

  override async migrateGuestCart(guestCartId: string, userId: string): Promise<Cart> {
    // Obtener carrito guest
    const guestCart = this.localAdapter.getCart();

    if (guestCart.isEmpty) {
      // Si está vacío, solo obtener el del usuario
      return await this.getCart(userId);
    }

    // Obtener carrito del usuario
    const userCart = await this.getCart(userId);

    // Merge
    const mergedCart = mergeCarts(guestCart, userCart);
    mergedCart.userId = userId;

    // Guardar
    await this.firebaseAdapter.saveCart(mergedCart);

    // Limpiar local
    this.localAdapter.deleteCart();

    return mergedCart;
  }

  // ==================== STOCK VALIDATION ====================

  override async validateStock(
    userId: string | null
  ): Promise<{ cart: Cart; itemsWithIssues: CartItem[] }> {
    const cart = await this.getCart(userId);

    if (cart.isEmpty) {
      return { cart, itemsWithIssues: [] };
    }

    // Validar stock de cada item
    const itemsWithIssues = await this.firebaseAdapter.validateCartStock(cart);

    if (itemsWithIssues.length > 0) {
      // Actualizar items con problemas en el carrito
      const updatedItems = cart.items.map(item => {
        const issueItem = itemsWithIssues.find(
          issue => issue.id === item.id
        );
        return issueItem || item;
      });

      const updatedCart = { ...cart, items: updatedItems };
      await this.saveCart(updatedCart);

      return { cart: updatedCart, itemsWithIssues };
    }

    return { cart, itemsWithIssues: [] };
  }

  override async checkStock(
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<{ available: boolean; stock: number }> {
    const stockCheck = await this.firebaseAdapter.checkStock(productId, variantId);

    return {
      available: stockCheck.available && stockCheck.stock >= quantity,
      stock: stockCheck.stock,
    };
  }

  // ==================== ANALYTICS ====================

  override async trackAbandonedCart(
    userId: string | null,
    cart: Cart
  ): Promise<void> {
    // Implementar tracking de carrito abandonado
    // Esto puede enviarse a un servicio de analytics o guardar en Firestore
    console.log('Carrito abandonado:', userId, cart.id);
  }

  override async getCartStats(userId: string): Promise<{
    totalCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    averageCartValue: number;
  }> {
    // Implementar obtención de estadísticas
    // Por ahora retornamos valores por defecto
    return {
      totalCarts: 0,
      abandonedCarts: 0,
      convertedCarts: 0,
      averageCartValue: 0,
    };
  }

  // ==================== SHIPPING ====================

  override async updateShipping(
    userId: string | null,
    shippingCost: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart = updateShippingCost(cart, shippingCost);
    return await this.saveCart(updatedCart);
  }

  override async calculateShipping(
    postalCode: string,
    cartTotal: number
  ): Promise<number> {
    // Implementar cálculo de envío basado en código postal
    // Por ahora retornamos un costo fijo
    
    // Envío gratis si el total es mayor a $500
    if (cartTotal >= 500) {
      return 0;
    }

    // Costo fijo de envío
    return 99;
  }
}
