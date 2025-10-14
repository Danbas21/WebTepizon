// ==========================================================
// CART ERRORS
// ==========================================================
// src/app/features/cart/domain/errors/cart.errors.ts

/**
 * Error base para el dominio de carrito
 */
export class CartError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'CartError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CartError);
        }
    }
}

/**
 * Errores específicos de carrito
 */
export class CartNotFoundError extends CartError {
    constructor(message = 'Carrito no encontrado') {
        super('CART_NOT_FOUND', message);
        this.name = 'CartNotFoundError';
    }
}

export class ItemNotFoundError extends CartError {
    constructor(productId: string) {
        super('ITEM_NOT_FOUND', `Producto ${productId} no encontrado en el carrito`);
        this.name = 'ItemNotFoundError';
    }
}

export class InvalidQuantityError extends CartError {
    constructor(message = 'Cantidad inválida') {
        super('INVALID_QUANTITY', message);
        this.name = 'InvalidQuantityError';
    }
}

export class InsufficientStockError extends CartError {
    constructor(productName: string, available: number) {
        super(
            'INSUFFICIENT_STOCK',
            `Solo hay ${available} unidades disponibles de "${productName}"`
        );
        this.name = 'InsufficientStockError';
    }
}

export class CartSyncError extends CartError {
    constructor(message = 'Error al sincronizar el carrito') {
        super('CART_SYNC_ERROR', message);
        this.name = 'CartSyncError';
    }
}
