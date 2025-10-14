// ==========================================================
// PAYMENT INTENT ENTITY
// ==========================================================
// src/app/features/checkout/domain/entities/payment-intent.entity.ts

/**
 * Estados de Payment Intent (Stripe)
 */
export type PaymentIntentStatus =
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';

/**
 * Entidad PaymentIntent del dominio
 * Representa un intento de pago con Stripe
 */
export interface PaymentIntent {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    orderId?: string;
    customerId?: string;
    createdAt: Date;
}