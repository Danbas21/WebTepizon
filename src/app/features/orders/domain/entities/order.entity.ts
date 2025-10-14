// ==========================================================
// ORDER ENTITY
// ==========================================================
// src/app/features/orders/domain/entities/order.entity.ts

import { AppliedCoupon } from "#app/features/cart/domain/entities/cart.entity.js";

/**
 * Estados de una orden
 */
export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';

/**
 * Métodos de pago
 */
export type PaymentMethod = 'CARD' | 'OXXO' | 'TRANSFER' | 'CASH_ON_DELIVERY';

/**
 * Dirección de envío
 */
export interface ShippingAddress {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

/**
 * Item de una orden (snapshot del producto)
 */
export interface OrderItem {
    productId: string;
    productName: string;
    productImage: string;
    variantId?: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
}

/**
 * Entidad Order del dominio
 * Representa una orden de compra
 */
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    userEmail: string;

    // Items
    items: OrderItem[];

    // Totales
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;

    // Pago
    paymentMethod: PaymentMethod;
    paymentIntentId?: string;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    paidAt?: Date;

    // Envío
    shippingAddress: ShippingAddress;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;

    // Estado
    status: OrderStatus;

    // Metadata
    notes?: string;
    appliedCoupon?: AppliedCoupon;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    cancelledAt?: Date;
}
