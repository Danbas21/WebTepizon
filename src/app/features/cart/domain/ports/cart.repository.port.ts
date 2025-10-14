/**
 * Cart Repository Port
 * 
 * Define el contrato que deben cumplir las implementaciones del repositorio
 * de carrito. Maneja operaciones de carrito tanto para usuarios autenticados
 * como para guests (localStorage).
 * 
 * @pattern Port (Hexagonal Architecture)
 */

import { Observable } from 'rxjs';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Coupon } from '../models/coupon.model';

/**
 * Puerto del repositorio de carrito
 * 
 * Las implementaciones deben soportar:
 * - Persistencia dual (Firestore + localStorage)
 * - Sincronización entre carritos (local <-> remoto)
 * - Stock en tiempo real
 * - Cupones de descuento
 */
export abstract class CartRepositoryPort {
  // ==================== CART OPERATIONS ====================

  /**
   * Obtiene el carrito del usuario (o crea uno nuevo si no existe)
   * 
   * @param userId - ID del usuario (null para guest)
   * @returns Promise con el carrito
   */
  abstract getCart(userId: string | null): Promise<Cart>;

  /**
   * Guarda el carrito
   * 
   * @param cart - Carrito a guardar
   * @returns Promise con el carrito guardado
   */
  abstract saveCart(cart: Cart): Promise<Cart>;

  /**
   * Observable del carrito en tiempo real
   * Emite cada vez que cambia el carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @returns Observable con el carrito actualizado
   */
  abstract watchCart(userId: string | null): Observable<Cart>;

  /**
   * Elimina el carrito
   * 
   * @param userId - ID del usuario (null para guest)
   */
  abstract deleteCart(userId: string | null): Promise<void>;

  // ==================== ITEM OPERATIONS ====================

  /**
   * Agrega un item al carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @param item - Item a agregar
   * @returns Promise con el carrito actualizado
   */
  abstract addItem(userId: string | null, item: CartItem): Promise<Cart>;

  /**
   * Remueve un item del carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @param itemId - ID del item a remover
   * @returns Promise con el carrito actualizado
   */
  abstract removeItem(userId: string | null, itemId: string): Promise<Cart>;

  /**
   * Actualiza la cantidad de un item
   * 
   * @param userId - ID del usuario (null para guest)
   * @param itemId - ID del item
   * @param quantity - Nueva cantidad
   * @returns Promise con el carrito actualizado
   */
  abstract updateItemQuantity(
    userId: string | null,
    itemId: string,
    quantity: number
  ): Promise<Cart>;

  /**
   * Limpia todos los items del carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @returns Promise con el carrito vacío
   */
  abstract clearItems(userId: string | null): Promise<Cart>;

  // ==================== COUPON OPERATIONS ====================

  /**
   * Aplica un cupón al carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @param couponCode - Código del cupón
   * @returns Promise con el carrito actualizado y el cupón aplicado
   */
  abstract applyCoupon(
    userId: string | null,
    couponCode: string
  ): Promise<{ cart: Cart; coupon: Coupon }>;

  /**
   * Remueve el cupón del carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @returns Promise con el carrito actualizado
   */
  abstract removeCoupon(userId: string | null): Promise<Cart>;

  /**
   * Valida un cupón sin aplicarlo
   * 
   * @param couponCode - Código del cupón
   * @param userId - ID del usuario (opcional)
   * @param subtotal - Subtotal del carrito
   * @returns Promise con el cupón si es válido, null si no
   */
  abstract validateCoupon(
    couponCode: string,
    userId?: string,
    subtotal?: number
  ): Promise<Coupon | null>;

  /**
   * Obtiene un cupón por código
   * 
   * @param code - Código del cupón
   * @returns Promise con el cupón o null si no existe
   */
  abstract getCouponByCode(code: string): Promise<Coupon | null>;

  // ==================== SYNC OPERATIONS ====================

  /**
   * Sincroniza el carrito local con el remoto
   * Útil cuando el usuario hace login
   * 
   * @param localUserId - ID del usuario local (null para guest)
   * @param remoteUserId - ID del usuario remoto (autenticado)
   * @returns Promise con el carrito sincronizado
   */
  abstract syncCarts(
    localUserId: string | null,
    remoteUserId: string
  ): Promise<Cart>;

  /**
   * Migra un carrito de guest a usuario autenticado
   * 
   * @param guestCartId - ID del carrito guest
   * @param userId - ID del usuario autenticado
   * @returns Promise con el carrito migrado
   */
  abstract migrateGuestCart(guestCartId: string, userId: string): Promise<Cart>;

  // ==================== STOCK VALIDATION ====================

  /**
   * Valida el stock de todos los items del carrito
   * Actualiza los items con problemas de stock
   * 
   * @param userId - ID del usuario (null para guest)
   * @returns Promise con el carrito actualizado y lista de items con problemas
   */
  abstract validateStock(
    userId: string | null
  ): Promise<{ cart: Cart; itemsWithIssues: CartItem[] }>;

  /**
   * Verifica si hay stock disponible para un item
   * 
   * @param productId - ID del producto
   * @param variantId - ID de la variante
   * @param quantity - Cantidad deseada
   * @returns Promise con disponibilidad y stock disponible
   */
  abstract checkStock(
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<{ available: boolean; stock: number }>;

  // ==================== ANALYTICS ====================

  /**
   * Registra un carrito abandonado
   * 
   * @param userId - ID del usuario
   * @param cart - Carrito abandonado
   */
  abstract trackAbandonedCart(userId: string | null, cart: Cart): Promise<void>;

  /**
   * Obtiene estadísticas del carrito del usuario
   * 
   * @param userId - ID del usuario
   * @returns Promise con estadísticas
   */
  abstract getCartStats(userId: string): Promise<{
    totalCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    averageCartValue: number;
  }>;

  // ==================== SHIPPING ====================

  /**
   * Actualiza el costo de envío del carrito
   * 
   * @param userId - ID del usuario (null para guest)
   * @param shippingCost - Costo de envío
   * @returns Promise con el carrito actualizado
   */
  abstract updateShipping(
    userId: string | null,
    shippingCost: number
  ): Promise<Cart>;

  /**
   * Calcula el costo de envío basado en la dirección
   * 
   * @param postalCode - Código postal
   * @param cartTotal - Total del carrito
   * @returns Promise con el costo de envío
   */
  abstract calculateShipping(
    postalCode: string,
    cartTotal: number
  ): Promise<number>;
}
