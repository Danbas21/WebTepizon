// ==========================================================
// LOCAL CART PORT
// ==========================================================
// src/app/features/cart/domain/ports/local-cart.port.ts

import { Observable } from 'rxjs';
import { Cart } from '../../../cart/domain/entities/cart.entity';
import { CartItem } from '../../../cart/domain/entities/cart-item.entity';

/**
 * Port para operaciones del carrito en almacenamiento local
 */
export interface LocalCartPort {
    /**
     * Obtener carrito actual
     */
    getCart(): Cart | null;

    /**
     * Obtener carrito como observable
     */
    getCart$(): Observable<Cart | null>;

    /**
     * Guardar carrito
     */
    saveCart(cart: Cart): Observable<void>;

    /**
     * Agregar item al carrito
     */
    addItem(item: CartItem, userId?: string): Observable<Cart>;

    /**
     * Actualizar cantidad de un item
     */
    updateItemQuantity(
        productId: string,
        quantity: number,
        variantId?: string
    ): Observable<Cart>;

    /**
     * Eliminar item del carrito
     */
    removeItem(productId: string, variantId?: string): Observable<Cart>;

    /**
     * Limpiar carrito
     */
    clearCart(userId?: string): Observable<void>;

    /**
     * Aplicar cupón de descuento
     */
    applyCoupon(code: string, discount: number): Observable<Cart>;

    /**
     * Remover cupón
     */
    removeCoupon(): Observable<Cart>;

    /**
     * Migrar carrito de invitado a usuario autenticado
     */
    migrateGuestCart(userId: string): Observable<Cart | null>;
}