// src/app/features/cart/application/facades/cart.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, tap } from 'rxjs';

// Domain
import { Cart } from '../../domain/entities/cart.entity';

// Application
import { CartUseCases } from '../use-cases/cart.use-cases';

// Infrastructure
import { CartRepository } from '../../infrastructure/repositories/cart.repository';

/**
 * Estado de la UI para carrito
 */
interface CartState {
    loading: boolean;
    error: string | null;
}

/**
 * Cart Facade
 * API simplificada para la UI del carrito
 * Maneja estado, operaciones y sincronización
 */
@Injectable({
    providedIn: 'root',
})
export class CartFacade {
    private readonly cartUseCases = inject(CartUseCases);
    private readonly cartRepository = inject(CartRepository);

    // ========== STATE MANAGEMENT ==========

    /**
     * Signal del carrito actual (desde repository)
     */
    readonly cart = toSignal(this.cartRepository.cart$, { initialValue: null });

    /**
     * Signals derivados del carrito
     */
    readonly itemCount = computed(() => this.cart()?.itemCount || 0);
    readonly subtotal = computed(() => this.cart()?.subtotal || 0);
    readonly discount = computed(() => this.cart()?.discount || 0);
    readonly shipping = computed(() => this.cart()?.shipping || 0);
    readonly tax = computed(() => this.cart()?.tax || 0);
    readonly total = computed(() => this.cart()?.total || 0);
    readonly isEmpty = computed(() => !this.cart() || this.cart()!.items.length === 0);
    readonly hasDiscount = computed(() => (this.cart()?.discount || 0) > 0);
    readonly appliedCoupon = computed(() => this.cart()?.appliedCoupon);

    /**
     * Signal de estado de la UI
     */
    private readonly cartState = signal<CartState>({
        loading: false,
        error: null,
    });

    /**
     * Signals derivados del estado
     */
    readonly isLoading = computed(() => this.cartState().loading);
    readonly error = computed(() => this.cartState().error);

    // ========== MÉTODOS PÚBLICOS ==========

    /**
     * Agregar producto al carrito
     */
    addProduct(
        productId: string,
        quantity: number = 1,
        variantId?: string
    ): Observable<Cart> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.addProductToCart(productId, quantity, variantId).pipe(
            tap({
                next: (cart) => {
                    this.setLoading(false);
                    // Mostrar notificación de éxito
                    this.showSuccessNotification('Producto agregado al carrito');
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Actualizar cantidad de un item
     */
    updateQuantity(
        productId: string,
        newQuantity: number,
        variantId?: string
    ): Observable<Cart> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.updateItemQuantity(productId, newQuantity, variantId).pipe(
            tap({
                next: (cart) => {
                    this.setLoading(false);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Incrementar cantidad de un item
     */
    incrementItem(productId: string, variantId?: string): Observable<Cart> {
        const cart = this.cart();
        if (!cart) {
            throw new Error('Cart not found');
        }

        const item = cart.items.find(
            (i) => i.productId === productId && i.variantId === variantId
        );

        if (!item) {
            throw new Error('Item not found in cart');
        }

        return this.updateQuantity(productId, item.quantity + 1, variantId);
    }

    /**
     * Decrementar cantidad de un item
     */
    decrementItem(productId: string, variantId?: string): Observable<Cart> {
        const cart = this.cart();
        if (!cart) {
            throw new Error('Cart not found');
        }

        const item = cart.items.find(
            (i) => i.productId === productId && i.variantId === variantId
        );

        if (!item) {
            throw new Error('Item not found in cart');
        }

        if (item.quantity <= 1) {
            return this.removeItem(productId, variantId);
        }

        return this.updateQuantity(productId, item.quantity - 1, variantId);
    }

    /**
     * Eliminar item del carrito
     */
    removeItem(productId: string, variantId?: string): Observable<Cart> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.removeItemFromCart(productId, variantId).pipe(
            tap({
                next: (cart) => {
                    this.setLoading(false);
                    this.showSuccessNotification('Producto eliminado del carrito');
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Limpiar carrito completo
     */
    clearCart(): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.clearCart().pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    this.showSuccessNotification('Carrito vaciado');
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Aplicar cupón de descuento
     */
    applyCoupon(code: string): Observable<Cart> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.applyCoupon(code).pipe(
            tap({
                next: (cart) => {
                    this.setLoading(false);
                    this.showSuccessNotification('Cupón aplicado correctamente');
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Remover cupón
     */
    removeCoupon(): Observable<Cart> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.removeCoupon().pipe(
            tap({
                next: (cart) => {
                    this.setLoading(false);
                    this.showSuccessNotification('Cupón removido');
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Migrar carrito de invitado
     * Se ejecuta automáticamente después del login
     */
    migrateGuestCart(userId: string): Observable<Cart | null> {
        return this.cartUseCases.migrateGuestCart(userId).pipe(
            tap({
                next: (cart) => {
                    if (cart) {
                        console.log('Cart migrated successfully');
                    }
                },
                error: (error) => {
                    console.error('Error migrating cart:', error);
                    // No mostramos error al usuario, ya que esto es automático
                },
            }),
            catchError(() => {
                return of(null);
            })
        );
    }

    /**
     * Validar carrito antes de checkout
     */
    validateForCheckout(): Observable<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        this.setLoading(true);
        this.clearError();

        return this.cartUseCases.validateCartForCheckout().pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    if (!result.valid) {
                        this.setError(result.errors[0] || 'Carrito inválido');
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                return of({
                    valid: false,
                    errors: [this.getErrorMessage(error)],
                    warnings: [],
                });
            })
        );
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.cartState.update((state) => ({ ...state, error: null }));
    }

    // ========== MÉTODOS PRIVADOS ==========

    private setLoading(loading: boolean): void {
        this.cartState.update((state) => ({ ...state, loading }));
    }

    private setError(error: string): void {
        this.cartState.update((state) => ({ ...state, error }));
    }

    private getErrorMessage(error: any): string {
        if (error?.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'Ocurrió un error con el carrito.';
    }

    /**
     * Mostrar notificación de éxito
     * TODO: Integrar con servicio de notificaciones
     */
    private showSuccessNotification(message: string): void {
        console.log('✓', message);
        // TODO: Implementar con servicio de notificaciones (toast, snackbar)
    }
}