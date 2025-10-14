// src/app/features/cart/application/use-cases/cart.use-cases.ts

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';

// Domain
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Product } from '../../../catalog/domain/entities/product.entity';

// Infrastructure
import { CartRepository } from '../../infrastructure/repositories/cart.repository';
import { CatalogRepository } from '../../../catalog/infrastructure/repositories/catalog.repository';
import { AuthRepository } from '../../../auth/infrastructure/repositories/auth.repository';

// Errors
import {
    InvalidQuantityError,
    InsufficientStockError,
    CartError
} from '../../domain/errors/cart.errors';

/**
 * Use Cases del Carrito
 * Contienen la lógica de negocio para gestión del carrito de compras
 */
@Injectable({
    providedIn: 'root',
})
export class CartUseCases {
    private readonly cartRepository = inject(CartRepository);
    private readonly catalogRepository = inject(CatalogRepository);
    private readonly authRepository = inject(AuthRepository);

    /**
     * Use Case: Agregar producto al carrito
     * Valida stock y disponibilidad antes de agregar
     */
    addProductToCart(
        productId: string,
        quantity: number = 1,
        variantId?: string
    ): Observable<Cart> {
        // Validar cantidad
        if (quantity < 1) {
            throw new InvalidQuantityError('Quantity must be at least 1');
        }

        // Obtener producto y validar disponibilidad
        return this.catalogRepository.getProductById(productId).pipe(
            switchMap((product) => {
                if (!product) {
                    throw new CartError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
                }

                // Validar estado del producto
                if (product.status !== 'ACTIVE') {
                    throw new CartError('PRODUCT_INACTIVE', `Product "${product.name}" is not available`);
                }

                // Validar stock
                if (product.stock < quantity) {
                    throw new InsufficientStockError(product.name, product.stock);
                }

                // Crear item del carrito
                const cartItem: CartItem = {
                    productId: product.id,
                    productName: product.name,
                    productImage: product.thumbnail || product.images[0],
                    variantId,
                    price: product.price,
                    quantity,
                    subtotal: product.price * quantity,
                    addedAt: new Date(),
                };

                // Obtener userId si está autenticado
                const userId = this.authRepository.currentUser()?.id;

                // Agregar al carrito
                return this.cartRepository.addItem(cartItem, userId).pipe(
                    tap((cart) => {
                        console.log('Product added to cart:', productId);

                        // Analytics
                        // this.analytics.trackEvent('add_to_cart', {
                        //   productId,
                        //   productName: product.name,
                        //   quantity,
                        //   price: product.price,
                        // });
                    })
                );
            }),
            catchError((error) => {
                console.error('Error adding product to cart:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Actualizar cantidad de un item
     * Valida stock disponible
     */
    updateItemQuantity(
        productId: string,
        newQuantity: number,
        variantId?: string
    ): Observable<Cart> {
        // Validar cantidad
        if (newQuantity < 0) {
            throw new InvalidQuantityError('Quantity cannot be negative');
        }

        // Si es 0, eliminar el item
        if (newQuantity === 0) {
            return this.removeItemFromCart(productId, variantId);
        }

        // Validar stock disponible
        return this.catalogRepository.getProductById(productId).pipe(
            switchMap((product) => {
                if (!product) {
                    throw new CartError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
                }

                if (product.stock < newQuantity) {
                    throw new InsufficientStockError(product.name, product.stock);
                }

                // Actualizar cantidad
                return this.cartRepository.updateItemQuantity(productId, newQuantity, variantId).pipe(
                    tap((cart) => {
                        console.log('Cart item quantity updated:', productId, newQuantity);
                    })
                );
            }),
            catchError((error) => {
                console.error('Error updating cart item quantity:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Eliminar item del carrito
     */
    removeItemFromCart(productId: string, variantId?: string): Observable<Cart> {
        return this.cartRepository.removeItem(productId, variantId).pipe(
            tap((cart) => {
                console.log('Item removed from cart:', productId);

                // Analytics
                // this.analytics.trackEvent('remove_from_cart', { productId });
            }),
            catchError((error) => {
                console.error('Error removing item from cart:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Limpiar carrito
     */
    clearCart(): Observable<void> {
        const userId = this.authRepository.currentUser()?.id;

        return this.cartRepository.clearCart(userId).pipe(
            tap(() => {
                console.log('Cart cleared');

                // Analytics
                // this.analytics.trackEvent('cart_cleared');
            }),
            catchError((error) => {
                console.error('Error clearing cart:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Aplicar cupón de descuento
     * Valida el cupón contra Firestore antes de aplicar
     */
    applyCoupon(code: string): Observable<Cart> {
        const cleanedCode = code.trim().toUpperCase();

        if (!cleanedCode) {
            throw new CartError('INVALID_COUPON', 'Coupon code cannot be empty');
        }

        // TODO: Validar cupón contra Firestore
        // Por ahora, validación simplificada
        return this.validateCoupon(cleanedCode).pipe(
            switchMap((couponData) => {
                if (!couponData.valid) {
                    throw new CartError('INVALID_COUPON', couponData.message || 'Invalid coupon');
                }

                return this.cartRepository.applyCoupon(cleanedCode, couponData.discount).pipe(
                    tap((cart) => {
                        console.log('Coupon applied:', cleanedCode, cart.discount);

                        // Analytics
                        // this.analytics.trackEvent('coupon_applied', {
                        //   code: cleanedCode,
                        //   discount: cart.discount,
                        // });
                    })
                );
            }),
            catchError((error) => {
                console.error('Error applying coupon:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Remover cupón
     */
    removeCoupon(): Observable<Cart> {
        return this.cartRepository.removeCoupon().pipe(
            tap((cart) => {
                console.log('Coupon removed');
            }),
            catchError((error) => {
                console.error('Error removing coupon:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Obtener carrito actual
     */
    getCart(): Observable<Cart | null> {
        return this.cartRepository.getCart$();
    }

    /**
     * Use Case: Migrar carrito de invitado a usuario autenticado
     * Se ejecuta automáticamente después del login
     */
    migrateGuestCart(userId: string): Observable<Cart | null> {
        return this.cartRepository.migrateGuestCart(userId).pipe(
            tap((cart) => {
                if (cart) {
                    console.log('Guest cart migrated to user:', userId);

                    // Analytics
                    // this.analytics.trackEvent('cart_migrated', {
                    //   userId,
                    //   itemCount: cart.itemCount,
                    // });
                }
            }),
            catchError((error) => {
                console.error('Error migrating guest cart:', error);
                // No bloqueamos el login si falla la migración
                return of(null);
            })
        );
    }

    /**
     * Use Case: Validar carrito antes de checkout
     * Verifica stock de todos los items
     */
    validateCartForCheckout(): Observable<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const cart = this.cartRepository.getCart();

        if (!cart || cart.items.length === 0) {
            return of({
                valid: false,
                errors: ['El carrito está vacío'],
                warnings: [],
            });
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        // Validar cada item
        const validations = cart.items.map((item) =>
            this.catalogRepository.getProductById(item.productId).pipe(
                map((product) => {
                    if (!product) {
                        errors.push(`Producto "${item.productName}" no encontrado`);
                        return false;
                    }

                    if (product.status !== 'ACTIVE') {
                        errors.push(`Producto "${item.productName}" ya no está disponible`);
                        return false;
                    }

                    if (product.stock < item.quantity) {
                        errors.push(
                            `Solo hay ${product.stock} unidades de "${item.productName}" disponibles`
                        );
                        return false;
                    }

                    if (product.stock < product.lowStockThreshold && product.stock >= item.quantity) {
                        warnings.push(`Pocas unidades de "${item.productName}" disponibles`);
                    }

                    return true;
                }),
                catchError(() => {
                    errors.push(`Error al validar "${item.productName}"`);
                    return of(false);
                })
            )
        );

        // Esperar todas las validaciones
        return of(validations).pipe(
            switchMap((validations$) => {
                return of({ valid: true, errors, warnings });
            })
        );
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Validar cupón contra Firestore
     * TODO: Implementar query a colección 'coupons'
     */
    private validateCoupon(code: string): Observable<{
        valid: boolean;
        discount: number;
        message?: string;
    }> {
        // TODO: Query a Firestore collection 'coupons'
        // Por ahora, validación mock
        const mockCoupons: Record<string, number> = {
            'WELCOME10': 0.1, // 10% descuento
            'SUMMER20': 0.2, // 20% descuento
            'PROMO50': 50, // $50 descuento fijo
        };

        if (code in mockCoupons) {
            return of({
                valid: true,
                discount: mockCoupons[code],
            });
        }

        return of({
            valid: false,
            discount: 0,
            message: 'Cupón inválido o expirado',
        });
    }
}