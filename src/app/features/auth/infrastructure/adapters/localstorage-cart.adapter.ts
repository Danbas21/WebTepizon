// src/app/features/cart/infrastructure/adapters/localstorage-cart.adapter.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

// Domain
import { Cart } from '../../../cart/domain/entities/cart.entity';
import { CartItem } from '../../../cart/domain/entities/cart-item.entity';
import { LocalCartPort } from '../../domain/ports/local-cart.port';
import { CartError } from '../../domain/errors/cart.errors';

/**
 * Adapter para LocalStorage - Carrito de compras
 * Proporciona persistencia local del carrito
 * Se sincroniza con Firestore cuando el usuario está autenticado
 */
@Injectable({
    providedIn: 'root',
})
export class LocalStorageCartAdapter implements LocalCartPort {
    private readonly CART_KEY = 'tepizon_cart';
    private readonly GUEST_CART_KEY = 'tepizon_guest_cart';

    // Subject para mantener el carrito en memoria
    private cartSubject = new BehaviorSubject<Cart | null>(null);

    /**
     * Observable del carrito actual
     */
    readonly cart$ = this.cartSubject.asObservable();

    constructor() {
        // Cargar carrito al inicializar
        this.loadCartFromStorage();
    }

    /**
     * Obtener carrito actual (sincrónico)
     */
    getCart(): Cart | null {
        return this.cartSubject.value;
    }

    /**
     * Obtener carrito actual (observable)
     */
    getCart$(): Observable<Cart | null> {
        return this.cart$;
    }

    /**
     * Guardar carrito completo
     */
    saveCart(cart: Cart): Observable<void> {
        try {
            const key = cart.userId ? this.CART_KEY : this.GUEST_CART_KEY;
            const serialized = this.serializeCart(cart);

            localStorage.setItem(key, serialized);
            this.cartSubject.next(cart);

            return of(undefined);
        } catch (error) {
            return throwError(() =>
                new CartError('STORAGE_ERROR', 'Failed to save cart to localStorage', error)
            );
        }
    }

    /**
     * Agregar item al carrito
     */
    addItem(item: CartItem, userId?: string): Observable<Cart> {
        try {
            let cart = this.getCart();

            if (!cart) {
                // Crear nuevo carrito
                cart = this.createEmptyCart(userId);
            }

            // Verificar si el item ya existe
            const existingItemIndex = cart.items.findIndex(
                (i) => i.productId === item.productId && i.variantId === item.variantId
            );

            if (existingItemIndex >= 0) {
                // Actualizar cantidad
                cart.items[existingItemIndex].quantity += item.quantity;
                cart.items[existingItemIndex].subtotal =
                    cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
            } else {
                // Agregar nuevo item
                cart.items.push(item);
            }

            // Recalcular totales
            cart = this.recalculateTotals(cart);
            cart.updatedAt = new Date();

            // Guardar
            this.saveCart(cart);

            return of(cart);
        } catch (error) {
            return throwError(() =>
                new CartError('ADD_ITEM_ERROR', 'Failed to add item to cart', error)
            );
        }
    }

    /**
     * Actualizar cantidad de un item
     */
    updateItemQuantity(
        productId: string,
        quantity: number,
        variantId?: string
    ): Observable<Cart> {
        try {
            const cart = this.getCart();

            if (!cart) {
                return throwError(() =>
                    new CartError('CART_NOT_FOUND', 'Cart not found')
                );
            }

            const itemIndex = cart.items.findIndex(
                (i) => i.productId === productId && i.variantId === variantId
            );

            if (itemIndex === -1) {
                return throwError(() =>
                    new CartError('ITEM_NOT_FOUND', 'Item not found in cart')
                );
            }

            if (quantity <= 0) {
                // Eliminar item si la cantidad es 0 o negativa
                return this.removeItem(productId, variantId);
            }

            // Actualizar cantidad
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].subtotal = quantity * cart.items[itemIndex].price;

            // Recalcular totales
            const updatedCart = this.recalculateTotals(cart);
            updatedCart.updatedAt = new Date();

            // Guardar
            this.saveCart(updatedCart);

            return of(updatedCart);
        } catch (error) {
            return throwError(() =>
                new CartError('UPDATE_ITEM_ERROR', 'Failed to update item quantity', error)
            );
        }
    }

    /**
     * Eliminar item del carrito
     */
    removeItem(productId: string, variantId?: string): Observable<Cart> {
        try {
            const cart = this.getCart();

            if (!cart) {
                return throwError(() =>
                    new CartError('CART_NOT_FOUND', 'Cart not found')
                );
            }

            cart.items = cart.items.filter(
                (i) => !(i.productId === productId && i.variantId === variantId)
            );

            // Recalcular totales
            const updatedCart = this.recalculateTotals(cart);
            updatedCart.updatedAt = new Date();

            // Guardar
            this.saveCart(updatedCart);

            return of(updatedCart);
        } catch (error) {
            return throwError(() =>
                new CartError('REMOVE_ITEM_ERROR', 'Failed to remove item from cart', error)
            );
        }
    }

    /**
     * Limpiar carrito
     */
    clearCart(userId?: string): Observable<void> {
        try {
            const key = userId ? this.CART_KEY : this.GUEST_CART_KEY;
            localStorage.removeItem(key);
            this.cartSubject.next(null);

            return of(undefined);
        } catch (error) {
            return throwError(() =>
                new CartError('CLEAR_CART_ERROR', 'Failed to clear cart', error)
            );
        }
    }

    /**
     * Aplicar cupón de descuento
     */
    applyCoupon(code: string, discount: number): Observable<Cart> {
        try {
            const cart = this.getCart();

            if (!cart) {
                return throwError(() =>
                    new CartError('CART_NOT_FOUND', 'Cart not found')
                );
            }

            cart.appliedCoupon = {
                code,
                discount,
                type: discount < 1 ? 'PERCENTAGE' : 'FIXED',
                appliedAt: new Date(),
            };

            // Recalcular totales con descuento
            const updatedCart = this.recalculateTotals(cart);
            updatedCart.updatedAt = new Date();

            // Guardar
            this.saveCart(updatedCart);

            return of(updatedCart);
        } catch (error) {
            return throwError(() =>
                new CartError('APPLY_COUPON_ERROR', 'Failed to apply coupon', error)
            );
        }
    }

    /**
     * Remover cupón
     */
    removeCoupon(): Observable<Cart> {
        try {
            const cart = this.getCart();

            if (!cart) {
                return throwError(() =>
                    new CartError('CART_NOT_FOUND', 'Cart not found')
                );
            }

            cart.appliedCoupon = undefined;

            // Recalcular totales sin descuento
            const updatedCart = this.recalculateTotals(cart);
            updatedCart.updatedAt = new Date();

            // Guardar
            this.saveCart(updatedCart);

            return of(updatedCart);
        } catch (error) {
            return throwError(() =>
                new CartError('REMOVE_COUPON_ERROR', 'Failed to remove coupon', error)
            );
        }
    }

    /**
     * Migrar carrito de invitado a usuario autenticado
     */
    migrateGuestCart(userId: string): Observable<Cart | null> {
        try {
            // Obtener carrito de invitado
            const guestCartData = localStorage.getItem(this.GUEST_CART_KEY);

            if (!guestCartData) {
                return of(null);
            }

            const guestCart = this.deserializeCart(guestCartData);

            // Actualizar userId
            guestCart.userId = userId;
            guestCart.updatedAt = new Date();

            // Guardar en storage de usuario
            localStorage.setItem(this.CART_KEY, this.serializeCart(guestCart));

            // Limpiar carrito de invitado
            localStorage.removeItem(this.GUEST_CART_KEY);

            this.cartSubject.next(guestCart);

            return of(guestCart);
        } catch (error) {
            return throwError(() =>
                new CartError('MIGRATION_ERROR', 'Failed to migrate guest cart', error)
            );
        }
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Cargar carrito desde localStorage al iniciar
     */
    private loadCartFromStorage(): void {
        try {
            // Intentar cargar carrito de usuario primero
            let cartData = localStorage.getItem(this.CART_KEY);

            // Si no hay, intentar carrito de invitado
            if (!cartData) {
                cartData = localStorage.getItem(this.GUEST_CART_KEY);
            }

            if (cartData) {
                const cart = this.deserializeCart(cartData);
                this.cartSubject.next(cart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            // No bloqueamos la app, simplemente no hay carrito
        }
    }

    /**
     * Crear carrito vacío
     */
    private createEmptyCart(userId?: string): Cart {
        return {
            id: this.generateCartId(),
            userId,
            items: [],
            subtotal: 0,
            discount: 0,
            shipping: 0,
            tax: 0,
            total: 0,
            itemCount: 0,
            appliedCoupon: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    /**
     * Recalcular totales del carrito
     */
    private recalculateTotals(cart: Cart): Cart {
        // Subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        // Descuento por cupón
        if (cart.appliedCoupon) {
            if (cart.appliedCoupon.type === 'PERCENTAGE') {
                cart.discount = cart.subtotal * cart.appliedCoupon.discount;
            } else {
                cart.discount = cart.appliedCoupon.discount;
            }
        } else {
            cart.discount = 0;
        }

        // Shipping (calculado según subtotal o configuración)
        cart.shipping = this.calculateShipping(cart.subtotal);

        // Tax (IVA 16% en México)
        const taxableAmount = cart.subtotal - cart.discount + cart.shipping;
        cart.tax = taxableAmount * 0.16;

        // Total
        cart.total = cart.subtotal - cart.discount + cart.shipping + cart.tax;

        return cart;
    }

    /**
     * Calcular costo de envío
     * TODO: Mover esta lógica a un servicio de envíos
     */
    private calculateShipping(subtotal: number): number {
        // Envío gratis para compras mayores a $500
        if (subtotal >= 500) {
            return 0;
        }
        // $100 de envío estándar
        return 100;
    }

    /**
     * Serializar carrito a JSON string
     */
    private serializeCart(cart: Cart): string {
        return JSON.stringify(cart, (key, value) => {
            // Convertir Dates a ISO strings
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        });
    }

    /**
     * Deserializar JSON string a Cart
     */
    private deserializeCart(data: string): Cart {
        const parsed = JSON.parse(data);

        // Convertir ISO strings de vuelta a Dates
        if (parsed.createdAt) {
            parsed.createdAt = new Date(parsed.createdAt);
        }
        if (parsed.updatedAt) {
            parsed.updatedAt = new Date(parsed.updatedAt);
        }
        if (parsed.appliedCoupon?.appliedAt) {
            parsed.appliedCoupon.appliedAt = new Date(parsed.appliedCoupon.appliedAt);
        }

        return parsed;
    }

    /**
     * Generar ID único para el carrito
     */
    private generateCartId(): string {
        return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}