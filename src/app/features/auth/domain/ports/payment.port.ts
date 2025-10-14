// ==========================================================
// PAYMENT PORT
// ==========================================================
// src/app/features/checkout/domain/ports/payment.port.ts

import { Observable } from 'rxjs';
import { PaymentIntent } from '../entities/payment-intent.entity';

/**
 * Tipos de métodos de pago soportados
 */
export type PaymentMethodType = 'CARD' | 'OXXO' | 'TRANSFER' | 'CASH_ON_DELIVERY';

/**
 * Datos para crear un Payment Intent
 */
export interface PaymentIntentData {
    amount: number;
    currency?: string;
    orderId: string;
    customerId?: string;
    metadata?: Record<string, any>;
}

/**
 * Port para operaciones de pago
 */
export interface PaymentPort {
    /**
     * Inicializar SDK de pagos
     */
    initializeStripe(): Promise<void>;

    /**
     * Crear elementos de pago (Card Element)
     */
    createCardElement(containerId: string): void;

    /**
     * Crear Payment Intent
     */
    createPaymentIntent(data: PaymentIntentData): Observable<PaymentIntent>;

    /**
     * Confirmar pago con tarjeta
     */
    confirmCardPayment(
        clientSecret: string,
        billingDetails: {
            name: string;
            email: string;
            phone?: string;
            address?: any;
        }
    ): Observable<{ success: boolean; paymentIntentId?: string; error?: string }>;

    /**
     * Confirmar pago con método alternativo
     */
    confirmAlternativePayment(
        clientSecret: string,
        paymentMethodType: PaymentMethodType,
        billingDetails: {
            name: string;
            email: string;
        }
    ): Observable<{ success: boolean; paymentIntentId?: string; nextAction?: any }>;

    /**
     * Procesar reembolso
     */
    processRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Observable<{ success: boolean; refundId: string }>;

    /**
     * Obtener estado de Payment Intent
     */
    retrievePaymentIntent(clientSecret: string): Observable<PaymentIntent>;

    /**
     * Limpiar elementos de pago
     */
    cleanup(): void;
}