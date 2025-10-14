// src/app/features/cart/infrastructure/repositories/cart.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Domain
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { LocalCartPort } from '../../domain/ports/local-cart.port';

// Infrastructure
import { LocalStorageCartAdapter } from '../adapters/localstorage-cart.adapter';

/**
 * Repository de Carrito
 * Maneja la persistencia del carrito en localStorage
 * Puede extenderse para sincronizar con Firestore
 */
@Injectable({
    providedIn: 'root',
})
export class CartRepository implements LocalCartPort {
    private readonly cartAdapter = inject(LocalStorageCartAdapter);

    /**
     * Observable del carrito
     */
    get cart$(): Observable<Cart | null> {
        return this.cartAdapter.cart$;
    }

    getCart(): Cart | null {
        return this.cartAdapter.getCart();
    }

    getCart$(): Observable<Cart | null> {
        return this.cartAdapter.getCart$();
    }

    saveCart(cart: Cart): Observable<void> {
        return this.cartAdapter.saveCart(cart);
    }

    addItem(item: CartItem, userId?: string): Observable<Cart> {
        return this.cartAdapter.addItem(item, userId);
    }

    updateItemQuantity(
        productId: string,
        quantity: number,
        variantId?: string
    ): Observable<Cart> {
        return this.cartAdapter.updateItemQuantity(productId, quantity, variantId);
    }

    removeItem(productId: string, variantId?: string): Observable<Cart> {
        return this.cartAdapter.removeItem(productId, variantId);
    }

    clearCart(userId?: string): Observable<void> {
        return this.cartAdapter.clearCart(userId);
    }

    applyCoupon(code: string, discount: number): Observable<Cart> {
        return this.cartAdapter.applyCoupon(code, discount);
    }

    removeCoupon(): Observable<Cart> {
        return this.cartAdapter.removeCoupon();
    }

    migrateGuestCart(userId: string): Observable<Cart | null> {
        return this.cartAdapter.migrateGuestCart(userId);
    }
}