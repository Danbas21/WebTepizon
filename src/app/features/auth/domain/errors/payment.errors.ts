// ==========================================================
// PAYMENT ERRORS
// ==========================================================
// src/app/features/checkout/domain/errors/payment.errors.ts

/**
 * Error base para el dominio de pagos
 */
export class PaymentError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'PaymentError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PaymentError);
        }
    }
}

/**
 * Errores específicos de pagos
 */
export class PaymentDeclinedError extends PaymentError {
    constructor(message = 'Tu tarjeta fue rechazada') {
        super('PAYMENT_DECLINED', message);
        this.name = 'PaymentDeclinedError';
    }
}

export class InvalidCardError extends PaymentError {
    constructor(message = 'Información de tarjeta inválida') {
        super('INVALID_CARD', message);
        this.name = 'InvalidCardError';
    }
}

export class InsufficientFundsError extends PaymentError {
    constructor(message = 'Fondos insuficientes') {
        super('INSUFFICIENT_FUNDS', message);
        this.name = 'InsufficientFundsError';
    }
}

export class PaymentProcessingError extends PaymentError {
    constructor(message = 'Error al procesar el pago') {
        super('PROCESSING_ERROR', message);
        this.name = 'PaymentProcessingError';
    }
}

export class StripeNotInitializedError extends PaymentError {
    constructor(message = 'Stripe no ha sido inicializado') {
        super('STRIPE_NOT_INITIALIZED', message);
        this.name = 'StripeNotInitializedError';
    }
}