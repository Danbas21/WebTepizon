/**
 * Firebase Cart Adapter
 * 
 * Implementación del adaptador para Firebase Firestore.
 * Maneja la persistencia del carrito para usuarios autenticados.
 * 
 * @pattern Adapter (Hexagonal Architecture)
 * @infrastructure Firebase
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  increment,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Cart, createCart, CartStatus } from '../../domain/models/cart.model';
import { CartItem } from '../../domain/models/cart-item.model';
import { Coupon, createCoupon, CouponStatus } from '../../domain/models/coupon.model';

/**
 * Adapter de Firebase para Cart
 * 
 * Responsabilidades:
 * - CRUD de carritos en Firestore
 * - Listeners en tiempo real
 * - Validación de stock con productos
 * - Gestión de cupones
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseCartAdapter {
  private readonly firestore = inject(Firestore);

  // Colecciones
  private readonly cartsCollection = collection(this.firestore, 'carts');
  private readonly couponsCollection = collection(this.firestore, 'coupons');
  private readonly productsCollection = collection(this.firestore, 'products');

  // ==================== CART OPERATIONS ====================

  /**
   * Obtiene el carrito del usuario
   */
  async getCart(userId: string): Promise<Cart | null> {
    try {
      const cartDoc = doc(this.cartsCollection, userId);
      const snapshot = await getDoc(cartDoc);

      if (!snapshot.exists()) {
        return null;
      }

      return this.mapDocToCart(snapshot.data());
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
      throw error;
    }
  }

  /**
   * Guarda o actualiza el carrito
   */
  async saveCart(cart: Cart): Promise<void> {
    if (!cart.userId) {
      throw new Error('No se puede guardar un carrito sin userId');
    }

    try {
      const cartDoc = doc(this.cartsCollection, cart.userId);
      const data = this.mapCartToDoc(cart);

      await setDoc(cartDoc, data, { merge: true });
    } catch (error) {
      console.error('Error guardando carrito:', error);
      throw error;
    }
  }

  /**
   * Observable del carrito en tiempo real
   */
  watchCart(userId: string): Observable<Cart | null> {
    const cartDoc = doc(this.cartsCollection, userId);

    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        cartDoc,
        snapshot => {
          if (snapshot.exists()) {
            observer.next(this.mapDocToCart(snapshot.data()));
          } else {
            observer.next(null);
          }
        },
        error => {
          console.error('Error en listener de carrito:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  /**
   * Elimina el carrito
   */
  async deleteCart(userId: string): Promise<void> {
    try {
      const cartDoc = doc(this.cartsCollection, userId);
      await deleteDoc(cartDoc);
    } catch (error) {
      console.error('Error eliminando carrito:', error);
      throw error;
    }
  }

  /**
   * Actualiza solo los items del carrito
   */
  async updateCartItems(userId: string, items: CartItem[]): Promise<void> {
    try {
      const cartDoc = doc(this.cartsCollection, userId);
      await updateDoc(cartDoc, {
        items: items.map(item => this.mapCartItemToDoc(item)),
        updatedAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando items:', error);
      throw error;
    }
  }

  // ==================== COUPON OPERATIONS ====================

  /**
   * Obtiene un cupón por código
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const normalizedCode = code.toUpperCase().trim();
      const q = query(this.couponsCollection, where('code', '==', normalizedCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return this.mapDocToCoupon({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error obteniendo cupón:', error);
      throw error;
    }
  }

  /**
   * Incrementa el contador de usos de un cupón
   */
  async incrementCouponUsage(couponId: string): Promise<void> {
    try {
      const couponDoc = doc(this.couponsCollection, couponId);
      await updateDoc(couponDoc, {
        usedCount: increment(1),
      });
    } catch (error) {
      console.error('Error incrementando uso de cupón:', error);
      throw error;
    }
  }

  /**
   * Obtiene el número de veces que un usuario ha usado un cupón
   */
  async getUserCouponUsage(userId: string, couponId: string): Promise<number> {
    try {
      // Aquí deberías tener una colección de uso de cupones por usuario
      // Por simplicidad, retornamos 0
      // En producción, implementar tracking detallado
      return 0;
    } catch (error) {
      console.error('Error obteniendo uso de cupón por usuario:', error);
      return 0;
    }
  }

  // ==================== STOCK VALIDATION ====================

  /**
   * Verifica el stock disponible de un producto/variante
   */
  async checkStock(productId: string, variantId: string): Promise<{
    available: boolean;
    stock: number;
  }> {
    try {
      const productDoc = doc(this.productsCollection, productId);
      const snapshot = await getDoc(productDoc);

      if (!snapshot.exists()) {
        return { available: false, stock: 0 };
      }

      const product = snapshot.data();
      const variant = product['variants']?.find((v: any) => v.id === variantId);

      if (!variant) {
        return { available: false, stock: 0 };
      }

      return {
        available: variant.stock > 0,
        stock: variant.stock,
      };
    } catch (error) {
      console.error('Error verificando stock:', error);
      return { available: false, stock: 0 };
    }
  }

  /**
   * Valida el stock de todos los items del carrito
   */
  async validateCartStock(cart: Cart): Promise<CartItem[]> {
    const itemsWithIssues: CartItem[] = [];

    for (const item of cart.items) {
      const stockCheck = await this.checkStock(item.productId, item.variantId);

      if (!stockCheck.available) {
        itemsWithIssues.push({
          ...item,
          isAvailable: false,
          hasStockIssue: true,
          stockMessage: 'Producto agotado',
        });
      } else if (item.quantity > stockCheck.stock) {
        itemsWithIssues.push({
          ...item,
          hasStockIssue: true,
          stockMessage: `Solo quedan ${stockCheck.stock} unidades`,
          maxQuantity: stockCheck.stock,
        });
      }
    }

    return itemsWithIssues;
  }

  // ==================== ABANDONED CART ====================

  /**
   * Marca carritos abandonados (>24h sin actividad)
   */
  async markAbandonedCarts(): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const q = query(
        this.cartsCollection,
        where('status', '==', CartStatus.ACTIVE),
        where('lastActivityAt', '<', Timestamp.fromDate(twentyFourHoursAgo))
      );

      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { status: CartStatus.ABANDONED })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error marcando carritos abandonados:', error);
    }
  }

  // ==================== MAPPERS ====================

  /**
   * Mapea documento de Firestore a Cart
   */
  private mapDocToCart(data: any): Cart {
    return createCart({
      id: data.id,
      userId: data.userId,
      items: data.items?.map((item: any) => this.mapDocToCartItem(item)) || [],
      appliedCoupon: data.appliedCoupon
        ? this.mapDocToCoupon(data.appliedCoupon)
        : null,
      totals: data.totals,
      status: data.status,
      isEmpty: data.isEmpty,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      lastActivityAt: data.lastActivityAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      source: data.source,
      sessionId: data.sessionId,
    });
  }

  /**
   * Mapea Cart a documento de Firestore
   */
  private mapCartToDoc(cart: Cart): any {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map(item => this.mapCartItemToDoc(item)),
      appliedCoupon: cart.appliedCoupon
        ? this.mapCouponToDoc(cart.appliedCoupon)
        : null,
      totals: cart.totals,
      status: cart.status,
      isEmpty: cart.isEmpty,
      createdAt: Timestamp.fromDate(cart.createdAt),
      updatedAt: Timestamp.fromDate(cart.updatedAt),
      lastActivityAt: Timestamp.fromDate(cart.lastActivityAt),
      expiresAt: Timestamp.fromDate(cart.expiresAt),
      source: cart.source,
      sessionId: cart.sessionId,
    };
  }

  /**
   * Mapea documento a CartItem
   */
  private mapDocToCartItem(data: any): CartItem {
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
      addedAt: data.addedAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      isAvailable: data.isAvailable,
      hasStockIssue: data.hasStockIssue,
      stockMessage: data.stockMessage,
    };
  }

  /**
   * Mapea CartItem a documento
   */
  private mapCartItemToDoc(item: CartItem): any {
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
      addedAt: Timestamp.fromDate(item.addedAt),
      updatedAt: Timestamp.fromDate(item.updatedAt),
      isAvailable: item.isAvailable,
      hasStockIssue: item.hasStockIssue,
      stockMessage: item.stockMessage,
    };
  }

  /**
   * Mapea documento a Coupon
   */
  private mapDocToCoupon(data: any): Coupon {
    return createCoupon({
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
      validFrom: data.validFrom?.toDate(),
      validUntil: data.validUntil?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }

  /**
   * Mapea Coupon a documento
   */
  private mapCouponToDoc(coupon: Coupon): any {
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
      validFrom: Timestamp.fromDate(coupon.validFrom),
      validUntil: Timestamp.fromDate(coupon.validUntil),
      createdAt: Timestamp.fromDate(coupon.createdAt),
      updatedAt: Timestamp.fromDate(coupon.updatedAt),
    };
  }
}
