// ==========================================================
// CART ENTITY
// ==========================================================
// src/app/features/cart/domain/entities/cart.entity.ts

import { CartItem } from "./cart-item.entity";

/**
 * Información de cupón aplicado
 */
export interface AppliedCoupon {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
    appliedAt: Date;
}

/**
 * Entidad Cart del dominio
 * Representa el carrito de compras
 */
export interface Cart {
    id: string;
    userId?: string;  // Opcional para carritos de invitado
    items: CartItem[];

    // Totales
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;

    // Cupón
    appliedCoupon?: AppliedCoupon;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
